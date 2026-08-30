"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Member = { id: string; role: string; user: { id: string; name: string; email: string } };
type Team = { id: string; name: string };

export function TeamManager({
  members,
  teams,
  currentTeamId,
  currentUserId,
  canManage,
}: {
  members: Member[];
  teams: Team[];
  currentTeamId: string;
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [inviteUrl, setInviteUrl] = React.useState<string>();

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/team/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email"), role: formData.get("role") }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return toast.error(data.error ?? "Could not send invitation.");
    setInviteUrl(data.inviteUrl);
    form.reset();
    toast.success(data.delivered ? "Invitation sent." : "Invitation created. Copy the link to share it.");
    router.refresh();
  }

  async function updateMember(id: string, role: string) {
    const response = await fetch(`/api/team/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(data.error ?? "Could not change the role.");
    toast.success("Role updated.");
    router.refresh();
  }

  async function removeMember(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from this team?`)) return;
    const response = await fetch(`/api/team/members/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(data.error ?? "Could not remove that member.");
    toast.success("Team member removed.");
    router.refresh();
  }

  async function switchTeam(organizationId: string) {
    const response = await fetch("/api/team/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    if (!response.ok) return toast.error("Could not switch teams.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {teams.length > 1 && (
        <div className="max-w-sm space-y-2">
          <Label>Active team</Label>
          <Select value={currentTeamId} onValueChange={switchTeam}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {members.map((member) => {
          const fixed = member.role === "OWNER" || member.user.id === currentUserId || !canManage;
          return (
            <div key={member.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{member.user.name}{member.user.id === currentUserId ? " (you)" : ""}</p>
                <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {fixed ? (
                  <Badge variant="secondary" className="capitalize">{member.role.toLowerCase()}</Badge>
                ) : (
                  <Select value={member.role} onValueChange={(role) => updateMember(member.id, role)}>
                    <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {canManage && member.role !== "OWNER" && member.user.id !== currentUserId && (
                  <Button variant="ghost" size="icon" aria-label={`Remove ${member.user.name}`} onClick={() => removeMember(member.id, member.user.name)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canManage && (
        <form onSubmit={invite} className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">Invite someone</h2>
          <p className="mt-1 text-sm text-muted-foreground">Invitations expire after seven days.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" required placeholder="teammate@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select id="invite-role" name="role" defaultValue="MEMBER" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="ADMIN">Admin</option><option value="MEMBER">Member</option><option value="VIEWER">Viewer</option>
              </select>
            </div>
            <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Invite</Button>
          </div>
          {inviteUrl && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <code className="min-w-0 flex-1 truncate text-xs">{inviteUrl}</code>
              <Button type="button" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Invite link copied."); }}>
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
