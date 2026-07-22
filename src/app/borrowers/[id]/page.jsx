"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/components/app/constants";
import { AppLayout, DetailGrid, DetailPage, Pill } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function BorrowerDetailsPage() {
  const params = useParams();
  const [search, setSearch] = useState("");
  const { loading, message, borrowers, transactions } = usePnwcData();
  const borrower = borrowers.find((row) => row.id === params.id || row.borrowerId === params.id || row.code === params.id);
  const rentals = borrower ? transactions.filter((transaction) => transaction.borrowerId === borrower.id) : [];
  const totalProducts = rentals.reduce((sum, transaction) => sum + (transaction.items?.length ? transaction.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0) : Number(transaction.quantity || 1)), 0);
  const activeProducts = rentals.reduce((sum, transaction) => sum + getRemainingItems(transaction).reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  return (
    <AppLayout activeView="Borrowers" search={search} onSearch={setSearch} loading={loading} message={message}>
      {borrower ? (
        <DetailPage eyebrow="Borrower module" title="Borrower details" recordId={borrower.borrowerId}>
          <div className="borrowerProfileName"><strong>{borrower.name}</strong><span>{borrower.phone}</span></div>
          <div className="borrowerStats">
            <div><b>{rentals.length}</b><span>Transactions</span></div>
            <div><b>{activeProducts}</b><span>On loan</span></div>
            <div><b>{totalProducts - activeProducts}</b><span>Returned</span></div>
          </div>
          <DetailGrid
            rows={[
              ["Name", borrower.name],
              ["Borrower ID", borrower.borrowerId],
              ["Phone", borrower.phone],
              ["Alternate Phone", borrower.alternatePhone],
              ["Address", borrower.address],
              ["City", borrower.city],
              ["State", borrower.state],
              ["Pincode", borrower.pincode],
              ["Emergency Contact", borrower.emergencyContact],
              ["Notes", borrower.notes],
            ]}
          />
          <section className="borrowerRentalHistory">
            <div className="sectionTitle"><h2>Equipment history</h2><span>{rentals.length} record{rentals.length === 1 ? "" : "s"}</span></div>
            {rentals.length ? rentals.map((transaction) => (
              <article className="borrowerRentalRow" key={transaction.id}>
                <div className="borrowerRentalTop"><div><b>{transaction.transactionId}</b><span>Issued {formatDate(transaction.transactionDate)}</span></div><Pill>{transaction.status}</Pill></div>
                <div className="borrowerRentalProducts">
                  {(transaction.items?.length ? transaction.items : [{ equipmentName: transaction.equipmentName, inventoryCode: transaction.inventoryCode, equipmentId: transaction.equipmentId, quantity: transaction.quantity }]).map((item) => {
                    const returned = (transaction.returnedItems || []).filter((returnedItem) => returnedItem.equipmentId === item.equipmentId).reduce((sum, returnedItem) => sum + Number(returnedItem.quantity || 0), 0);
                    return <span key={item.equipmentId}>{item.equipmentName} · {Math.max(0, Number(item.quantity || 1) - returned)} remaining / {item.quantity} total</span>;
                  })}
                </div>
                {transaction.returnEvents?.length ? transaction.returnEvents.map((event, index) => <small key={`${transaction.id}-return-${index}`}>Returned {formatDate(event.returnDate)} · Received by {event.receivedBy || "Account"}</small>) : <small>No return recorded yet</small>}
              </article>
            )) : <p className="emptyText">No equipment has been issued to this borrower yet.</p>}
          </section>
        </DetailPage>
      ) : <section className="glass panel"><p className="emptyText">Borrower not found.</p></section>}
    </AppLayout>
  );
}

function getRemainingItems(transaction) {
  const items = transaction.items?.length ? transaction.items : [{ equipmentId: transaction.equipmentId, quantity: transaction.quantity || 1 }];
  const returned = new Map();
  (transaction.returnedItems || []).forEach((item) => returned.set(item.equipmentId, (returned.get(item.equipmentId) || 0) + Number(item.quantity || 0)));
  return items.map((item) => ({ ...item, quantity: Math.max(0, Number(item.quantity || 1) - (returned.get(item.equipmentId) || 0)) })).filter((item) => item.quantity > 0);
}
