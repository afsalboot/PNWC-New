"use client";

import { useState } from "react";
import { FaArrowRightFromBracket, FaFloppyDisk, FaUser } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { api, uploadImage } from "@/components/app/constants";
import { AppLayout, Field, Title, UploadField } from "@/components/app/ui";

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
        {form.profileImage ? <img src={form.profileImage} alt="" /> : <span className="photoPlaceholder profilePhotoPlaceholder"><FaUser /></span>}
        <div>
          <strong>{user?.name || "PNWC User"}</strong>
          <p>{user?.role || "volunteer"} - {user?.username}</p>
        </div>
      </div>
      <form className="formGrid" onSubmit={saveProfile}>
        <Field label="Name" value={form.name} onChange={(value) => updateProfile("name", value)} required />
        <Field label="Email" type="email" value={form.email} onChange={(value) => updateProfile("email", value)} />
        <Field label="Phone" value={form.phone} onChange={(value) => updateProfile("phone", value)} />
        <div className="field">
          <span>Role</span>
          <div className="readonlyField">{user?.role || "volunteer"}</div>
        </div>
        <UploadField label="Profile Photo" value={form.profileImage} onChange={(value) => updateProfile("profileImage", value)} onUpload={uploadProfileImage} uploading={uploading} />
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
