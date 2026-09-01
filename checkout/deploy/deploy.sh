#!/usr/bin/env bash
#
# Deploy the merged site + PHP checkout to the production host.
#
#   sudo bash checkout/deploy/deploy.sh
#
# Safe to re-run. It stops at the first failure rather than half-deploying.
#
# It DOES reset the working tree to origin/main. That discards uncommitted
# local changes, which is only safe because they were captured in commit
# e9742f2 and pushed — verify with `git status` before the first run.

set -euo pipefail

APP=/var/www/kpindicator.com
OWNER=almalinux
BRANCH="${1:-main}"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "Restoring ownership"
# Something has been running git as root here, which leaves objects the
# service user cannot write and breaks every later commit.
chown -R "$OWNER:$OWNER" "$APP"

step "Fetching $BRANCH"
sudo -u "$OWNER" git -C "$APP" fetch --prune origin
sudo -u "$OWNER" git -C "$APP" reset --hard "origin/$BRANCH"

# Run a command as the service user, from the app directory, with a real HOME.
# npx has no --prefix: given one it ignores it and resolves from the registry
# instead, which would silently pull a different major of Prisma and point
# `migrate deploy` at production with it. cd is the only reliable way.
as_owner() { sudo -u "$OWNER" env HOME="/home/$OWNER" sh -c "cd '$APP' && $*"; }

step "Installing dependencies"
as_owner "npm ci --no-audit --no-fund"

step "Applying migrations and generating the Prisma client"
as_owner "npx --no-install prisma migrate deploy"
as_owner "npx --no-install prisma generate"

step "Building the site"
# NEXT_PUBLIC_* is inlined at build time, so the checkout URL has to be in
# .env before this runs — a restart alone will not pick it up.
as_owner "npm run build"

step "Checking the checkout config exists"
if [ ! -f "$APP/checkout/.env" ]; then
    echo "  WARNING: checkout/.env does not exist — the checkout cannot take a payment."
    echo "           Copy checkout/.env.example and fill in the Stripe values."
fi

step "Giving the checkout its own DATABASE_URL"
# The site's .env is 600 and owned by the repo user, so the nginx user PHP-FPM
# runs as cannot read it — DATABASE_URL simply looks unset and orders silently
# stop being recorded. Copy that one line across rather than loosening the
# site's .env, which also holds SES keys and OAuth secrets the checkout has no
# business reading.
if [ -f "$APP/checkout/.env" ] && ! grep -q '^DATABASE_URL' "$APP/checkout/.env"; then
    if grep -q '^DATABASE_URL' "$APP/.env"; then
        grep '^DATABASE_URL' "$APP/.env" >> "$APP/checkout/.env"
        echo "  copied DATABASE_URL from the site .env"
    else
        echo "  WARNING: no DATABASE_URL in $APP/.env — orders will not be recorded."
    fi
else
    echo "  already present"
fi

step "Creating the session directory"
# The system session.save_path on this distro is owned root:apache while the
# pool runs as nginx, so PHP silently fails to persist sessions and every CSRF
# check fails. The app keeps its own instead.
install -d -o nginx -g nginx -m 770 "$APP/checkout/storage/sessions"
echo "  checkout/storage/sessions -> nginx:nginx 770"

step "Installing the PostgreSQL driver"
if ! php -m | grep -qi pdo_pgsql; then
    echo "  pdo_pgsql missing — installing"
    dnf install -y php-pgsql
    systemctl restart php-fpm
else
    echo "  already installed"
fi

step "Permissioning the checkout secrets"
# Re-applied after the DATABASE_URL append above, which is written by the repo
# user and would otherwise leave the mode where umask put it.
chown "$OWNER:nginx" "$APP/checkout/.env" 2>/dev/null || true
chmod 640 "$APP/checkout/.env" 2>/dev/null || true
echo "  checkout/.env -> $OWNER:nginx 640"

step "Restarting services"
# Before the connection check, not after. The check exits non-zero when
# anything is still unconfigured, and under `set -e` that used to abort the
# deploy here — leaving the new build sitting on disk while the old one kept
# serving.
systemctl restart kpindicator.com.service
nginx -t && systemctl reload nginx

step "Checking the PHP checkout"
# Run as nginx, not as the repo owner: the point is to prove the user PHP-FPM
# actually runs as can read the config. Non-fatal — the deploy is already done
# by this point, so this reports rather than gates.
sudo -u nginx php "$APP/checkout/bin/connection-check.php" || \
    echo "  ^ deploy completed, but the checkout is not fully configured (see above)"

step "Done"
systemctl --no-pager --lines=0 status kpindicator.com.service | head -3
