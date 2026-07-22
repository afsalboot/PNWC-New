"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/components/app/constants";
import { AppLayout, DetailGrid, DetailPage, Pill } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function ReturnDetailsPage() {
  const params = useParams();
  const [search, setSearch] = useState("");
  const { loading, message, transactions } = usePnwcData();
  const transaction = transactions.find((row) => (
    ["Returned", "Partial"].includes(row.status) && (row.id === params.id || row.transactionId === params.id || row.code === params.id)
  ));

  return (
    <AppLayout activeView="Returns" search={search} onSearch={setSearch} loading={loading} message={message}>
      {transaction ? (
        <DetailPage eyebrow="Return module" title="Return details" recordId={transaction.transactionId} status={transaction.status}>
            <section className="returnDetailHero">
              <div><span>Borrower</span><strong>{transaction.borrowerName}</strong></div>
              <div><span>Received by</span><strong>{transaction.receivedBy || "Account"}</strong></div>
            </section>
            <section className="transactionProducts">
              <div className="transactionProductsHeader"><div><span>Returned products</span><small>Products and quantities received</small></div><b>{getReturnedItems(transaction).length} product{getReturnedItems(transaction).length === 1 ? "" : "s"}</b></div>
              <div className="transactionProductList">
                {getReturnedItems(transaction).map((item) => <div className="transactionProductRow" key={item.equipmentId}><div><strong>{item.equipmentName}</strong><span>{item.inventoryCode}</span></div><b>x{item.quantity}</b></div>)}
              </div>
            </section>
            <DetailGrid
              rows={[
                ["Returned", formatDate(transaction.returnDate)],
                ["Received By", transaction.receivedBy],
                ["Return Condition", transaction.returnCondition],
                ["Issued", formatDate(transaction.transactionDate)],
              ]}
            />
            {transaction.returnEvents?.length > 1 && <section className="returnEventHistory"><h2>Return timeline</h2>{transaction.returnEvents.map((event, index) => <div key={`${transaction.id}-${index}`}><b>{formatDate(event.returnDate)}</b><span>{event.receivedBy || "Account"} received {event.items?.length || 0} product line(s)</span></div>)}</section>}
        </DetailPage>
      ) : <section className="glass panel"><p className="emptyText">Return not found.</p></section>}
    </AppLayout>
  );
}

function getReturnedItems(transaction) {
  if (transaction.returnedItems?.length) {
    const itemMap = new Map((transaction.items || []).map((item) => [item.equipmentId, item]));
    return transaction.returnedItems.map((item) => ({ ...item, ...(itemMap.get(item.equipmentId) || {}) }));
  }
  return transaction.items?.length ? transaction.items : [{ equipmentId: transaction.equipmentId, equipmentName: transaction.equipmentName, inventoryCode: transaction.inventoryCode, quantity: transaction.quantity || 1 }];
}
