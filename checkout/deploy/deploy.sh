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

step "Permissioning the checkout secrets"
# PHP-FPM runs as nginx here, not as the repo owner, so a 600 .env owned by
# almalinux is unreadable to it — and the failure is silent: the checkout just
# reports that payments are not configured. Owner edits, group reads, world
# gets nothing.
if [ -f "$APP/checkout/.env" ]; then
    chown "$OWNER:nginx" "$APP/checkout/.env"
    chmod 640 "$APP/checkout/.env"
    echo "  checkout/.env -> $OWNER:nginx 640"
else
    echo "  WARNING: checkout/.env does not exist — the checkout cannot take a payment."
    echo "           Copy checkout/.env.example and fill in the Stripe values."
fi

step "Checking the PHP checkout"
if ! php -m | grep -qi pdo_pgsql; then
    echo "  pdo_pgsql missing — installing"
    dnf install -y php-pgsql
    systemctl restart php-fpm
fi
# Run as nginx, not as the repo owner: the point is to prove the user PHP-FPM
# actually runs as can read the config, not that root can.
sudo -u nginx php "$APP/checkout/bin/connection-check.php"

step "Restarting services"
systemctl restart kpindicator.com.service
nginx -t && systemctl reload nginx

step "Done"
systemctl --no-pager --lines=0 status kpindicator.com.service | head -3
