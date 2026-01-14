import { useMemo, useState, useEffect } from "react";
import { auth } from "../lib/firebase";

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
  const [active, setActive] = useState("profile");
  const [teamMembers, setTeamMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Team Member",
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) return;
      const display = user.displayName || "";
      const [firstName = "User", lastName = ""] = display
        .split(" ")
        .filter(Boolean)
        .reduce(
          (acc, cur, idx) => {
            if (idx === 0) acc[0] = cur;
            else acc[1] = `${acc[1]} ${cur}`.trim();
            return acc;
          },
          ["User", ""]
        );
      const name = display || user.email?.split("@")[0] || "User";
      const email = user.email || "-";
      const lastActive = user.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
        : "-";
      setTeamMembers([
        {
          id: "self",
          name,
          firstName,
          lastName,
          email,
          role: "Owner",
          lastActive,
          status: "Accepted",
        },
      ]);
    });
    return () => unsub && unsub();
  }, []);

  const activeTab = useMemo(
    () => tabs.find((t) => t.key === active) || tabs[0],
    [active]
  );

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
                          onChange={(e) =>
                            setTeamMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id ? { ...m, role: e.target.value } : m
                              )
                            )
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 cursor-pointer"
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
                          <button
                            type="button"
                            onClick={() => setEditingMember(member)}
                            className="hover:text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          {member.id !== "self" && (
                            <button
                              type="button"
                              onClick={() =>
                                setTeamMembers((prev) =>
                                  prev.filter((m) => m.id !== member.id)
                                )
                              }
                              className="hover:text-rose-600 text-xs font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl px-4 py-4 bg-slate-50">
                  {!showAddForm ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Add team member
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center justify-center rounded-lg bg-[#FFBD00] text-slate-900 text-sm font-semibold px-4 py-2 hover:bg-[#E0A700] cursor-pointer"
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
                          onClick={() => {
                            const email = newMember.email.trim();
                            const firstName = newMember.firstName.trim() || "New";
                            const lastName = newMember.lastName.trim();
                            if (!email) return;
                            setTeamMembers((prev) => [
                              ...prev,
                              {
                                id: Date.now(),
                                name: `${firstName} ${lastName}`.trim(),
                                firstName,
                                lastName,
                                email,
                                role: newMember.role,
                                lastActive: new Date().toLocaleDateString(),
                                status: "Invited",
                              },
                            ]);
                            setNewMember({
                              firstName: "",
                              lastName: "",
                              email: "",
                              role: "Team Member",
                            });
                            setShowAddForm(false);
                          }}
                          className="inline-flex items-center justify-center rounded-lg bg-[#FFBD00] text-slate-900 text-sm font-semibold px-4 py-2 hover:bg-[#E0A700] cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updated) => {
            setTeamMembers((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}

function EditMemberModal({ member, onClose, onSave }) {
  const [firstName, setFirstName] = useState(member.firstName || "");
  const [lastName, setLastName] = useState(member.lastName || "");
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState(member.role || "Team Member");

  return (
    <div className="fixed inset-0 z-[210] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Edit User</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none cursor-pointer"
            aria-label="Close edit user"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800">User Info</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="First Name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Field
              label="Last Name"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Field
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Phone (Optional)"
              placeholder="Enter phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              User Role
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 cursor-pointer"
            >
              <option>Owner</option>
              <option>Admin</option>
              <option>Team Member</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...member,
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim(),
                email,
                phone,
                role,
              })
            }
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-[#E0A700] cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
