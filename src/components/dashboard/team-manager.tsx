"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, History, Loader2, LockKeyhole, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Member = { id: string; role: string; user: { id: string; name: string; email: string } };
type Team = { id: string; name: string };
type Invitation = { id: string; email: string; role: string; expiresAt: string };
type Project = { id: string; name: string; restricted: boolean; memberIds: string[] };
type AuditLog = { id: string; actorName: string; action: string; target: string | null; createdAt: string };

const ROLE_DESCRIPTIONS: Record<string, string> = {
  OWNER: "Full control, including ownership transfer and all projects.",
  ADMIN: "Manages members, invitations, settings, and all projects.",
  MEMBER: "Uses shared projects and restricted projects assigned to them.",
  VIEWER: "Read-only team role with the same project visibility rules.",
};

const ACTION_LABELS: Record<string, string> = {
  TEAM_CREATED: "created the team", TEAM_RENAMED: "renamed the team",
  INVITATION_SENT: "invited", INVITATION_RESENT: "resent an invitation to",
  INVITATION_REVOKED: "revoked the invitation for", INVITATION_ACCEPTED: "joined the team",
  MEMBER_ROLE_CHANGED: "changed a member role", MEMBER_REMOVED: "removed a member",
  MEMBER_LEFT: "left the team", OWNERSHIP_TRANSFERRED: "transferred ownership to",
  PROJECT_ACCESS_CHANGED: "changed project access for",
};

export function TeamManager({ members, invitations, teams, projects, auditLogs, currentTeamId, currentUserId, currentRole }: {
  members: Member[]; invitations: Invitation[]; teams: Team[]; projects: Project[]; auditLogs: AuditLog[];
  currentTeamId: string; currentUserId: string; currentRole: string;
}) {
  const router = useRouter();
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";
  const isOwner = currentRole === "OWNER";
  const [busy, setBusy] = React.useState<string>();
  const [inviteUrl, setInviteUrl] = React.useState<string>();

  async function api(url: string, method: string, body?: unknown) {
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
  }
  async function run(key: string, work: () => Promise<void>) {
    setBusy(key);
    try { await work(); } catch (error) { toast.error(error instanceof Error ? error.message : "Something went wrong."); }
    finally { setBusy(undefined); }
  }
  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const data = new FormData(form);
    await run("invite", async () => { const result = await api("/api/team/invitations", "POST", { email: data.get("email"), role: data.get("role") }); setInviteUrl(result.inviteUrl); form.reset(); toast.success(result.delivered ? "Invitation sent." : "Invitation created. Copy the link to share it."); router.refresh(); });
  }
  async function updateMember(id: string, role: string) { await run(`member-${id}`, async () => { await api(`/api/team/members/${id}`, "PATCH", { role }); toast.success("Role updated."); router.refresh(); }); }
  async function removeMember(id: string, name: string) { if (window.confirm(`Remove ${name} from this team?`)) await run(`member-${id}`, async () => { await api(`/api/team/members/${id}`, "DELETE"); toast.success("Member removed."); router.refresh(); }); }
  async function switchTeam(organizationId: string) { await run("switch", async () => { await api("/api/team/switch", "POST", { organizationId }); router.push("/dashboard"); router.refresh(); }); }
  async function renameTeam(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const data = new FormData(e.currentTarget); await run("rename", async () => { await api("/api/team/organization", "PATCH", { name: data.get("name") }); toast.success("Team renamed."); router.refresh(); }); }
  async function createTeam(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); await run("create", async () => { await api("/api/team/organizations", "POST", { name: data.get("name") }); form.reset(); toast.success("Team created."); router.push("/dashboard/team"); router.refresh(); }); }
  async function resendInvitation(id: string) { await run(`invite-${id}`, async () => { const result = await api(`/api/team/invitations/${id}/resend`, "POST"); setInviteUrl(result.inviteUrl); toast.success(result.delivered ? "Invitation resent." : "New invite link created."); router.refresh(); }); }
  async function revokeInvitation(id: string, email: string) { if (window.confirm(`Revoke the invitation for ${email}?`)) await run(`invite-${id}`, async () => { await api(`/api/team/invitations/${id}`, "DELETE"); toast.success("Invitation revoked."); router.refresh(); }); }
  async function transferOwnership(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const memberId = String(new FormData(e.currentTarget).get("memberId") ?? ""); const member = members.find((item) => item.id === memberId); if (member && window.confirm(`Transfer ownership to ${member.user.name}? You will become an admin.`)) await run("ownership", async () => { await api("/api/team/ownership", "POST", { memberId }); toast.success("Ownership transferred."); router.refresh(); }); }
  async function leaveTeam() { if (window.confirm("Leave this team? You will immediately lose access.")) await run("leave", async () => { await api("/api/team/leave", "DELETE"); toast.success("You left the team."); router.push("/dashboard"); router.refresh(); }); }
  async function saveProjectAccess(e: React.FormEvent<HTMLFormElement>, project: Project) { e.preventDefault(); const data = new FormData(e.currentTarget); await run(`project-${project.id}`, async () => { await api(`/api/team/projects/${project.id}/access`, "PATCH", { restricted: data.get("restricted") === "on", memberIds: data.getAll("memberIds").map(String) }); toast.success("Project access updated."); router.refresh(); }); }

  return <div className="space-y-10">
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">Active team</h2><Select value={currentTeamId} onValueChange={switchTeam} disabled={busy === "switch"}><SelectTrigger className="mt-4 w-full"><SelectValue /></SelectTrigger><SelectContent>{teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select>{canManage && <form onSubmit={renameTeam} className="mt-4 flex gap-2"><Input name="name" defaultValue={teams.find((team) => team.id === currentTeamId)?.name} required minLength={2} maxLength={100} /><Button variant="outline" disabled={busy === "rename"}>Rename</Button></form>}</div>
      <form onSubmit={createTeam} className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">Create another team</h2><p className="mt-1 text-sm text-muted-foreground">For a separate company, client, or workspace.</p><div className="mt-4 flex gap-2"><Input name="name" required minLength={2} maxLength={100} placeholder="Team name" /><Button disabled={busy === "create"}>{busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Create</Button></div></form>
    </section>

    <section><h2 className="text-lg font-semibold">Members</h2><div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">{members.map((member) => { const fixed = member.role === "OWNER" || member.user.id === currentUserId || !canManage; return <div key={member.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.user.name}{member.user.id === currentUserId ? " (you)" : ""}</p><p className="truncate text-xs text-muted-foreground">{member.user.email}</p><p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[member.role]}</p></div><div className="flex items-center gap-2">{fixed ? <Badge variant="secondary" className="capitalize">{member.role.toLowerCase()}</Badge> : <Select value={member.role} disabled={busy === `member-${member.id}`} onValueChange={(role) => updateMember(member.id, role)}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="MEMBER">Member</SelectItem><SelectItem value="VIEWER">Viewer</SelectItem></SelectContent></Select>}{canManage && member.role !== "OWNER" && member.user.id !== currentUserId && <Button variant="ghost" size="icon" onClick={() => removeMember(member.id, member.user.name)} aria-label={`Remove ${member.user.name}`}><Trash2 className="size-4" /></Button>}</div></div>; })}</div></section>

    {canManage && <section className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={invite} className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">Invite someone</h2><p className="mt-1 text-sm text-muted-foreground">Links expire after seven days.</p><div className="mt-4 space-y-3"><Input name="email" type="email" required placeholder="teammate@company.com" /><select name="role" defaultValue="MEMBER" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="ADMIN">Admin — manage team and all projects</option><option value="MEMBER">Member — shared and assigned projects</option><option value="VIEWER">Viewer — read shared and assigned projects</option></select><Button disabled={busy === "invite"}>{busy === "invite" ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}Invite</Button></div>{inviteUrl && <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3"><code className="min-w-0 flex-1 truncate text-xs">{inviteUrl}</code><Button type="button" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Invite link copied."); }}><Copy className="size-3.5" />Copy</Button></div>}</form>
      <div className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">Pending invitations</h2><div className="mt-4 space-y-3">{invitations.length ? invitations.map((invitation) => <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{invitation.email}</p><p className="text-xs text-muted-foreground">{invitation.role.toLowerCase()} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><div className="flex"><Button variant="ghost" size="icon" disabled={busy === `invite-${invitation.id}`} onClick={() => resendInvitation(invitation.id)} aria-label="Resend"><RefreshCw className="size-4" /></Button><Button variant="ghost" size="icon" disabled={busy === `invite-${invitation.id}`} onClick={() => revokeInvitation(invitation.id, invitation.email)} aria-label="Revoke"><Trash2 className="size-4" /></Button></div></div>) : <p className="text-sm text-muted-foreground">No pending invitations.</p>}</div></div>
    </section>}

    {canManage && projects.length > 0 && <section><div className="flex items-center gap-2"><LockKeyhole className="size-5 text-primary" /><h2 className="text-lg font-semibold">Project access</h2></div><p className="mt-1 text-sm text-muted-foreground">Owners and admins always see every project. Restricted projects are visible only to selected members and viewers.</p><div className="mt-4 space-y-4">{projects.map((project) => <form key={project.id} onSubmit={(event) => saveProjectAccess(event, project)} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{project.name}</p><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="restricted" defaultChecked={project.restricted} /> Restricted project</label></div><Button variant="outline" disabled={busy === `project-${project.id}`}>Save access</Button></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{members.filter((member) => member.role === "MEMBER" || member.role === "VIEWER").map((member) => <label key={member.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" name="memberIds" value={member.id} defaultChecked={project.memberIds.includes(member.id)} />{member.user.name}<span className="text-xs text-muted-foreground">({member.role.toLowerCase()})</span></label>)}</div></form>)}</div></section>}

    {isOwner && members.length > 1 && <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-base font-semibold">Transfer ownership</h2><p className="mt-1 text-sm text-muted-foreground">The new owner receives full control. You become an admin.</p><form onSubmit={transferOwnership} className="mt-4 flex gap-2"><select name="memberId" required className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Choose a member</option>{members.filter((member) => member.user.id !== currentUserId).map((member) => <option key={member.id} value={member.id}>{member.user.name} — {member.user.email}</option>)}</select><Button variant="outline" disabled={busy === "ownership"}>Transfer</Button></form></section>}

    <section><div className="flex items-center gap-2"><History className="size-5 text-primary" /><h2 className="text-lg font-semibold">Audit history</h2></div><div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">{auditLogs.length ? auditLogs.map((log) => <div key={log.id} className="p-4 text-sm"><p><span className="font-medium">{log.actorName}</span> {ACTION_LABELS[log.action] ?? log.action.toLowerCase().replaceAll("_", " ")} {log.target && <span className="font-medium">{log.target}</span>}</p><p className="mt-0.5 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p></div>) : <p className="p-4 text-sm text-muted-foreground">No team activity recorded yet.</p>}</div></section>
    {!isOwner && <section className="border-t border-border pt-6"><Button variant="outline" onClick={leaveTeam} disabled={busy === "leave"}>Leave team</Button></section>}
  </div>;
}
