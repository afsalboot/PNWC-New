"use client";

import { useState } from "react";
import { AppLayout, Title } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function SettingsPage() {
  const [search, setSearch] = useState("");
  const { loading, message } = usePnwcData();

  return (
    <AppLayout activeView="Settings" search={search} onSearch={setSearch} loading={loading} message={message}>
      <section className="glass panel">
        <Title eyebrow="System" title="Settings" />
        <p className="emptyText">Settings controls can be connected here as the configuration options are finalized.</p>
      </section>
    </AppLayout>
  );
}
