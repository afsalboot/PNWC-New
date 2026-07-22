"use client";

import { useState } from "react";
import { FaUser } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { AppLayout, DataPanel } from "@/components/app/ui";
import { api, filterRows } from "@/components/app/constants";
import { usePnwcData } from "@/components/app/usePnwcData";

const roleOptions = [
  { value: "super_admin", label: "Super Admin" },
  { value: "manager", label: "Manager" },
  { value: "volunteer", label: "Volunteer" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const { loading, message, setMessage, users, loadData } = usePnwcData();
  const otherUsers = users.filter((row) => row.id !== user?.id && row.username !== user?.username);
  const visibleUsers = filterRows(otherUsers, search, ["name", "username", "email", "role"]);

  async function updateRole(targetUser, role) {
    setSavingUserId(targetUser.id);
    try {
      await api("/api/users", {
        method: "PATCH",
        body: JSON.stringify({ id: targetUser.id, role }),
      });
      setMessage(`${targetUser.name || targetUser.username}'s role updated.`);
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingUserId("");
    }
  }

  return (
    <AppLayout activeView="Users" search={search} onSearch={setSearch} loading={loading} message={message}>
      {user?.role !== "super_admin" ? (
        <section className="glass panel">
          <p className="emptyText">Super admin access required.</p>
        </section>
      ) : loading ? (
        <section className="glass panel">
          <div className="sectionTitle">
            <div>
              <span className="eyebrow">Live records</span>
              <h2>Users</h2>
            </div>
          </div>
          <div className="recordGrid">
            {Array.from({ length: 6 }).map((_, index) => (
              <article className="recordCard skeletonCard" key={index}>
                <span className="skeletonAvatar" />
                <span className="skeletonLine wide" />
                <span className="skeletonLine" />
                <span className="skeletonLine short" />
                <span className="skeletonInput" />
              </article>
            ))}
          </div>
        </section>
      ) : (
      <DataPanel title="Users" empty="Your team list is clear. Invite or approve the next PNWC helper.">
        {visibleUsers.map((user) => (
          <article className="recordCard" key={user.id || user.username}>
            {user.profileImage ? (
              <img className="recordPhoto avatarPhoto" src={user.profileImage} alt="" />
            ) : (
              <div className="recordPhoto avatarPhoto photoPlaceholder profilePhotoPlaceholder">
                <FaUser />
              </div>
            )}
            <b>{user.name || user.username}</b>
            <span>{user.username || user.email}</span>
            <p>{user.status || "Active"}</p>
            <label className="roleControl">
              <span>Role</span>
              <select
                value={user.role || "volunteer"}
                onChange={(event) => updateRole(user, event.target.value)}
                disabled={savingUserId === user.id}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            {savingUserId === user.id && <span className="mutedCell">Saving role...</span>}
          </article>
        ))}
      </DataPanel>
      )}
    </AppLayout>
  );
}
