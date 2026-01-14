import { useMemo, useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db, functions } from "../lib/firebase";
import { useAccount } from "../lib/accountContext";

const tabs = [
  { key: "profile", label: "Profile" },
  { key: "account", label: "Account" },
  { key: "team", label: "Team" },
];

const Field = ({ label, type = "text", placeholder, value, onChange }) => (
  <label className="block space-y-1">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
    />
  </label>
);

export default function SettingsModal({ onClose }) {
  const { accountId } = useAccount();
  const [active, setActive] = useState("profile");
  const [currentUser, setCurrentUser] = useState(null);
  const [memberRows, setMemberRows] = useState([]);
  const [inviteRows, setInviteRows] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [teamMessage, setTeamMessage] = useState("");
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Team Member",
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user || null);
    });
    return () => unsub && unsub();
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.key === active) || tabs[0],
    [active]
  );

  const mapRole = (role) => {
    if (role === "Owner") return "owner";
    if (role === "Admin") return "admin";
    return "member";
  };

  const getRoleValue = (role) => {
    if (!role) return "member";
    const lowered = String(role).trim().toLowerCase();
    if (["owner", "admin", "member"].includes(lowered)) return lowered;
    return "member";
  };

  const roleLabel = (role) => {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    return "Team Member";
  };

  const displayNameFromEmail = (email) => {
    if (!email) return "User";
    return email.split("@")[0] || email;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const date = value?.toDate ? value.toDate() : new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  useEffect(() => {
    if (!accountId || !currentUser) {
      setMemberRows([]);
      setInviteRows([]);
      return undefined;
    }

    const membersRef = collection(db, "accounts", accountId, "members");
    const invitesRef = collection(db, "accounts", accountId, "invites");

    const unsubMembers = onSnapshot(membersRef, (snap) => {
      const rows = snap.docs.map((doc) => {
        const data = doc.data() || {};
        const email = data.email || "-";
        const isSelf = doc.id === currentUser.uid;
        const name =
          (isSelf && currentUser.displayName) ||
          displayNameFromEmail(email);
        return {
          id: doc.id,
          uid: doc.id,
          kind: "member",
          name,
          email,
          role: roleLabel(getRoleValue(data.role)),
          roleValue: getRoleValue(data.role),
          status: "Accepted",
          lastActive: formatDate(data.joinedAt),
        };
      });
      rows.sort((a, b) => {
        if (a.uid === currentUser.uid) return -1;
        if (b.uid === currentUser.uid) return 1;
        return a.name.localeCompare(b.name);
      });
      setMemberRows(rows);
    });

    const unsubInvites = onSnapshot(
      query(invitesRef, orderBy("createdAt", "desc")),
      (snap) => {
        const rows = snap.docs
          .map((doc) => {
            const data = doc.data() || {};
            if (data.status === "accepted") return null;
            return {
              id: doc.id,
              kind: "invite",
              name: displayNameFromEmail(data.email),
              email: data.email || doc.id,
              role: roleLabel(getRoleValue(data.role)),
              roleValue: getRoleValue(data.role),
              status: "Invited",
              lastActive: formatDate(data.createdAt),
            };
          })
          .filter(Boolean);
        setInviteRows(rows);
      }
    );

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [accountId, currentUser]);

  const teamMembers = useMemo(
    () => [...memberRows, ...inviteRows],
    [memberRows, inviteRows]
  );

  const currentRole = useMemo(() => {
    const entry = memberRows.find((row) => row.uid === currentUser?.uid);
    return entry?.roleValue || "member";
  }, [memberRows, currentUser]);

  const canManage = ["owner", "admin"].includes(currentRole);


  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none cursor-pointer"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col">
          <nav className="flex gap-2 px-5 pt-4 pb-3 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = active === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#FFBD00] text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {activeTab.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {active === "profile" &&
                    "Update your personal details and contact information."}
                  {active === "account" &&
                    "Manage organization details and billing preferences."}
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#FFBD00] text-slate-900 text-sm font-semibold px-4 py-2 hover:bg-[#E0A700] cursor-pointer">
                Save changes
              </button>
            </div>

            {active === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First name" placeholder="First name" />
                <Field label="Last name" placeholder="Last name" />
                <Field label="Email" type="email" placeholder="you@example.com" />
                <Field label="Phone number" placeholder="(555) 123-4567" />
                <Field label="Job function" placeholder="e.g. Operations" />
                <Field label="Role" placeholder="e.g. Admin" />
              </div>
            )}

            {active === "account" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company name" placeholder="Company" />
                <Field label="Workspace domain" placeholder="company.com" />
                <Field label="Timezone" placeholder="UTC" />
                <Field label="Billing contact" placeholder="billing@company.com" />
                <Field label="Address" placeholder="Street, City, State" />
                <Field label="Country" placeholder="Country" />
              </div>
            )}

            {active === "team" && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  <div className="grid grid-cols-12 gap-6 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-600">
                    <span className="col-span-3">User</span>
                    <span className="col-span-3">Role</span>
                    <span className="col-span-3">Status</span>
                    <span className="col-span-3">Last active</span>
                  </div>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="group grid grid-cols-12 gap-6 px-5 py-4 items-center text-sm text-slate-800 relative"
                    >
                      <div className="col-span-3 space-y-0.5">
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-slate-500 text-xs">{member.email}</div>
                      </div>
                      <div className="col-span-3">
                        <select
                          value={member.role}
                          disabled={
                            !canManage ||
                            member.kind !== "member" ||
                            member.roleValue === "owner" ||
                            member.uid === currentUser?.uid
                          }
                          onChange={async (e) => {
                            const nextRole = e.target.value;
                            if (!accountId || member.kind !== "member") return;
                            setTeamMessage("");
                            try {
                              const updateMemberRole = httpsCallable(
                                functions,
                                "updateMemberRole"
                              );
                              await updateMemberRole({
                                accountId,
                                memberUid: member.uid,
                                role: mapRole(nextRole),
                              });
                            } catch (err) {
                              setTeamMessage(
                                err?.message || "Could not update role."
                              );
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option>Owner</option>
                          <option>Admin</option>
                          <option>Team Member</option>
                        </select>
                      </div>
                      <div className="col-span-3 text-slate-600">
                        {member.status || "Invited"}
                      </div>
                      <div className="col-span-3 flex items-center justify-between text-slate-600">
                        <span>{member.lastActive}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-3 text-slate-500">
                          {member.kind === "invite" ? (
                            <>
                              <button
                                type="button"
                                disabled={!canManage}
                                onClick={async () => {
                                  if (!accountId || !canManage) return;
                                  setTeamMessage("");
                                  try {
                                    const inviteMember = httpsCallable(
                                      functions,
                                      "inviteMember"
                                    );
                                    await inviteMember({
                                      accountId,
                                      email: member.email,
                                      role: member.roleValue,
                                    });
                                    setTeamMessage("Invite resent.");
                                  } catch (err) {
                                    setTeamMessage(
                                      err?.message || "Could not resend invite."
                                    );
                                  }
                                }}
                                className="hover:text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Resend
                              </button>
                              <button
                                type="button"
                                disabled={!canManage}
                                onClick={async () => {
                                  if (!accountId || !canManage) return;
                                  setTeamMessage("");
                                  try {
                                    const revokeInvite = httpsCallable(
                                      functions,
                                      "revokeInvite"
                                    );
                                    await revokeInvite({
                                      accountId,
                                      email: member.email,
                                    });
                                    setTeamMessage("Invite revoked.");
                                  } catch (err) {
                                    setTeamMessage(
                                      err?.message || "Could not revoke invite."
                                    );
                                  }
                                }}
                                className="hover:text-rose-600 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Revoke
                              </button>
                              <button
                                type="button"
                                disabled={!canManage}
                                onClick={async () => {
                                  if (!accountId || !canManage) return;
                                  const link = `${window.location.origin}/invite?accountId=${encodeURIComponent(
                                    accountId || ""
                                  )}`;
                                  try {
                                    await navigator.clipboard.writeText(link);
                                    setTeamMessage("Invite link copied.");
                                  } catch {
                                    setTeamMessage("Could not copy invite link.");
                                  }
                                }}
                                className="hover:text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Copy link
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                !canManage ||
                                member.uid === currentUser?.uid ||
                                member.roleValue === "owner"
                              }
                              onClick={async () => {
                                if (!accountId || member.kind !== "member")
                                  return;
                                setTeamMessage("");
                                try {
                                  const removeMember = httpsCallable(
                                    functions,
                                    "removeMember"
                                  );
                                  await removeMember({
                                    accountId,
                                    memberUid: member.uid,
                                  });
                                  setTeamMessage("Member removed.");
                                } catch (err) {
                                  setTeamMessage(
                                    err?.message || "Could not remove member."
                                  );
                                }
                              }}
                              className="hover:text-rose-600 text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {teamMessage && (
                  <p className="text-xs text-slate-600">{teamMessage}</p>
                )}

                <div className="border border-slate-200 rounded-xl px-4 py-4 bg-slate-50">
                  {!showAddForm ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Add team member
                      </span>
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center justify-center rounded-lg bg-[#FFBD00] text-slate-900 text-sm font-semibold px-4 py-2 hover:bg-[#E0A700] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        + Add
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          Add team member
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                        >
                          Collapse
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label="First Name"
                          placeholder="First name"
                          value={newMember.firstName}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                        />
                        <Field
                          label="Last Name"
                          placeholder="Last name"
                          value={newMember.lastName}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label="Email"
                          type="email"
                          placeholder="teammate@example.com"
                          value={newMember.email}
                          onChange={(e) =>
                            setNewMember((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                        <div className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700">
                            User Role
                          </span>
                          <select
                            value={newMember.role}
                            onChange={(e) =>
                              setNewMember((prev) => ({
                                ...prev,
                                role: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 cursor-pointer"
                          >
                            <option>Owner</option>
                            <option>Admin</option>
                            <option>Team Member</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setNewMember({
                              firstName: "",
                              lastName: "",
                              email: "",
                              role: "Team Member",
                            });
                          }}
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={inviting}
                          onClick={async () => {
                            const email = newMember.email.trim().toLowerCase();
                            if (!email) return;
                            if (!canManage) {
                              setInviteMessage("Only owners or admins can invite.");
                              return;
                            }
                            if (!accountId) {
                              setInviteMessage("Set an account before inviting.");
                              return;
                            }
                            setInviting(true);
                            setInviteMessage("");
                            try {
                              const inviteMember = httpsCallable(
                                functions,
                                "inviteMember"
                              );
                              await inviteMember({
                                accountId,
                                email,
                                role: mapRole(newMember.role),
                              });
                              setInviteMessage("Invite sent.");
                              setNewMember({
                                firstName: "",
                                lastName: "",
                                email: "",
                                role: "Team Member",
                              });
                              setShowAddForm(false);
                            } catch (err) {
                              const message =
                                err?.message || "Could not send invite.";
                              setInviteMessage(message);
                            } finally {
                              setInviting(false);
                            }
                          }}
                          className="inline-flex items-center justify-center rounded-lg bg-[#FFBD00] text-slate-900 text-sm font-semibold px-4 py-2 hover:bg-[#E0A700] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {inviting ? "Sending..." : "Add"}
                        </button>
                      </div>
                      {inviteMessage && (
                        <p className="text-xs text-slate-600">{inviteMessage}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
