"use client";

import { useState } from "react";
import { FaArrowRightFromBracket, FaCamera, FaFloppyDisk, FaUser } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { api, formatRole, uploadImage } from "@/components/app/constants";
import { AppLayout, Field, Title } from "@/components/app/ui";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Manage your account details.");

  return (
    <AppLayout activeView="Profile" search={search} onSearch={setSearch} loading={authLoading} message={message}>
      <ProfileForm key={user?.id || "profile"} user={user} logout={logout} refreshUser={refreshUser} setMessage={setMessage} />
    </AppLayout>
  );
}

function ProfileForm({ user, logout, refreshUser, setMessage }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profileImage: user?.profileImage || "",
  });

  function updateProfile(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadProfileImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const image = await uploadImage(file, "profiles");
      updateProfile("profileImage", image);
      setMessage("Profile photo uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    await api("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    await refreshUser();
    setMessage("Profile updated.");
  }

  return (
    <section className="glass panel profilePanel">
      <Title eyebrow="Profile" title="My Account" />
      <div className="profileSummary">
        <label className="group relative grid h-[82px] w-[82px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[24px]" title="Change profile photo">
          {form.profileImage ? <img src={form.profileImage} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center bg-[#087f78] text-2xl text-white"><FaUser /></span>}
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-lg text-white opacity-0 transition-opacity group-hover:opacity-100"><FaCamera /></span>
          <input className="sr-only" type="file" accept="image/*" onChange={(event) => uploadProfileImage(event.target.files?.[0])} disabled={uploading} />
        </label>
        <div>
          <strong>{user?.name || "PNWC User"}</strong>
          <p>{formatRole(user?.role)} - {user?.username}</p>
        </div>
      </div>
      <form className="formGrid" onSubmit={saveProfile}>
        <Field label="Name" value={form.name} onChange={(value) => updateProfile("name", value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => updateProfile("email", value)} />
        <Field label="Phone" value={form.phone} onChange={(value) => updateProfile("phone", value)} />
        <div className="field">
          <span>Role</span>
          <div className="readonlyField">{formatRole(user?.role)}</div>
        </div>
        <button className="primaryButton iconTextButton" disabled={uploading}>
          <FaFloppyDisk />
          <span>{uploading ? "Uploading..." : "Save Profile"}</span>
        </button>
        <button type="button" className="secondaryButton iconTextButton" onClick={uploading ? undefined : logout}>
          <FaArrowRightFromBracket />
          <span>Logout</span>
        </button>
      </form>
    </section>
  );
}
