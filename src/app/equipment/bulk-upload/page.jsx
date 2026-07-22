"use client";

import { useState } from "react";
import { AppLayout, Title } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function BulkUploadPage() {
  const [search, setSearch] = useState("");
  const { loading, message } = usePnwcData();

  return (
    <AppLayout activeView="Equipment" search={search} onSearch={setSearch} loading={loading} message={message}>
      <section className="glass panel">
        <Title eyebrow="Equipment module" title="Bulk upload" />
        <p className="emptyText">Bulk upload controls can be added here when the import format is finalized.</p>
      </section>
    </AppLayout>
  );
}
