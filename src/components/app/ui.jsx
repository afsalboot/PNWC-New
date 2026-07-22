"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  FaAddressCard,
  FaBoxesStacked,
  FaCalendarDays,
  FaCheck,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaEye,
  FaGaugeHigh,
  FaHandHoldingMedical,
  FaImage,
  FaPen,
  FaPlus,
  FaPowerOff,
  FaTrash,
  FaTriangleExclamation,
  FaUser,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { views, formatDate } from "./constants";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

const searchableViews = ["Transactions", "Borrowers", "Equipment", "Returns", "Users"];
const searchPlaceholders = {
  Transactions: "Find transaction",
  Borrowers: "Find borrower by name, phone, address, or ID",
  Equipment: "Find equipment by name, code, category, or condition",
  Returns: "Find returned equipment, borrower, code, or receiver",
  Users: "Find team member by name, username, email, or role",
};
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function AppLayout({ activeView, search, onSearch, loading, message, children }) {
  const { user, logout } = useAuth();
  const [navHidden, setNavHidden] = useState(false);
  const visibleViews = views.filter((view) => !view.roles || view.roles.includes(user?.role));
  const canViewUsers = visibleViews.some((view) => view.icon === "users");
  const showSearch = searchableViews.includes(activeView);
  const showStatus = loading || Boolean(message);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      setNavHidden(scrollingDown && currentScrollY > 90);
      lastScrollY = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen px-3 pt-24 pb-28 sm:px-6">
      <Navbar activeView={activeView} canViewUsers={canViewUsers} user={user} logout={logout} hidden={navHidden} />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-4xl font-black tracking-normal text-[#17201f] sm:text-5xl">{activeView}</h1>
        </div>
        {showSearch && (
          <label className="grid w-full max-w-md gap-1.5 rounded-xl border border-[#dce5e3] bg-white/90 px-3 py-2 shadow-sm sm:w-96">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-[#667572]">Search</span>
            <input className="min-w-0 border-0 bg-transparent text-sm font-semibold text-[#17201f] outline-none placeholder:text-[#93a09d]" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholders[activeView] || `Search ${activeView.toLowerCase()}`} />
          </label>
        )}
      </section>

      {showStatus && <div className="mx-auto w-full max-w-6xl rounded-xl border border-[#bcded9] bg-[#effaf8] px-4 py-3 text-sm font-bold text-[#087f78]">{loading ? "Loading live data..." : message}</div>}
      <section className="mx-auto w-full max-w-6xl">{children}</section>

      <BottomNav activeView={activeView} user={user} />
    </main>
  );
}

export function Field({ label, value, onChange, type = "text", options, required }) {
  if (type === "date") {
    return (
      <div className="field">
        <span>{label}</span>
        <DatePicker value={value} onChange={onChange} required={required} label={label} />
      </div>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} />
      )}
    </label>
  );
}

function DatePicker({ value, onChange, required, label }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseDateValue(value) || new Date()));
  const pickerRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const today = new Date();
  const calendarDays = buildCalendarDays(visibleMonth);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function changeMonth(offset) {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  function togglePicker() {
    if (!open) {
      setVisibleMonth(startOfMonth(selectedDate || new Date()));
    }
    setOpen((current) => !current);
  }

  function selectDate(date) {
    onChange(formatDateValue(date));
    setOpen(false);
  }

  return (
    <div className="datePicker" ref={pickerRef}>
      <button
        type="button"
        className={`datePickerTrigger ${open ? "active" : ""}`}
        aria-label={`${label} date`}
        aria-expanded={open}
        onClick={togglePicker}
      >
        <span>{value ? formatDisplayDate(value) : "dd-mm-yyyy"}</span>
        <FaCalendarDays aria-hidden="true" />
      </button>
      {required && <input className="datePickerNative" tabIndex={-1} value={value} onChange={() => {}} required />}
      {open && (
        <div className="datePickerPanel" role="dialog" aria-label={`${label} calendar`}>
          <div className="datePickerHeader">
            <strong>{monthFormatter.format(visibleMonth)}</strong>
            <div>
              <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                <FaChevronLeft />
              </button>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
                <FaChevronRight />
              </button>
            </div>
          </div>
          <div className="datePickerGrid datePickerWeekdays">
            {dayLabels.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="datePickerGrid">
            {calendarDays.map((date) => {
              const outside = date.getMonth() !== visibleMonth.getMonth();
              const selected = selectedDate && isSameDay(date, selectedDate);
              const current = isSameDay(date, today);
              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  className={`${outside ? "outside" : ""} ${selected ? "selected" : ""} ${current ? "today" : ""}`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="datePickerFooter">
            <button type="button" onClick={() => onChange("")}>Clear</button>
            <button type="button" onClick={() => selectDate(new Date())}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDateValue(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = parseDateValue(value);
  if (!date) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function TextArea({ label, value, onChange }) {
  return (
    <label className="field span2">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function UploadField({ label, value, onChange, onUpload, uploading, showPreview = true }) {
  return (
    <label className="field span2">
      <span>{label}</span>
      <div className="uploadRow">
        {showPreview && (
          <div className="uploadPreviewShell">
            {value ? (
              <img src={value} alt="" />
            ) : (
              <div className="uploadPreview">
                <FaImage />
                <span>No photo</span>
              </div>
            )}
          </div>
        )}
        <div className="uploadDrop">
          <strong>{uploading ? "Uploading..." : "Choose image"}</strong>
          <p>Upload a clear photo or paste an image URL below.</p>
          <input type="file" accept="image/*" onChange={(event) => onUpload(event.target.files?.[0])} disabled={uploading} />
        </div>
      </div>
    </label>
  );
}

export function Pill({ children }) {
  return <span className={`pill ${String(children).replaceAll(" ", "").toLowerCase()}`}>{children}</span>;
}

export function Stat({ label, value }) {
  return (
    <article className="glass stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function StatWithIcon({ label, value, icon: Icon = FaChartLine, tone = "green" }) {
  return (
    <article className={`glass stat metricCard ${tone}`}>
      <div>
        <Icon />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </article>
  );
}

export function Title({ title }) {
  if (!title) return null;

  return (
    <div className="sectionTitle span2">
      <div>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

export function DataPanel({ title, empty, children, contentClassName = "recordGrid" }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="glass panel">
      <Title eyebrow="Live records" title={title} />
      <div className={contentClassName}>{hasRows ? children : <p className="emptyText">{empty}</p>}</div>
    </section>
  );
}

export function RecordActions({ viewHref, onEdit, onDelete }) {
  return (
    <div className="recordActions">
      {viewHref && (
        <Link className="iconButton small" href={viewHref} aria-label="View" title="View">
          <FaEye />
        </Link>
      )}
      {onEdit && (
        <button type="button" className="iconButton small" aria-label="Edit" title="Edit" onClick={onEdit}>
          <FaPen />
        </button>
      )}
      {onDelete && (
        <button type="button" className="iconButton small dangerButton" aria-label="Delete" title="Delete" onClick={onDelete}>
          <FaTrash />
        </button>
      )}
    </div>
  );
}

export function DetailGrid({ rows }) {
  return (
    <div className="detailGrid">
      {rows.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "").map(([label, value]) => (
        <div className="detailItem" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

export function DetailPage({ eyebrow, title, recordId, status, children }) {
  return (
    <section className="glass panel detailPage">
      <Title eyebrow={eyebrow} title={title} />
      {(recordId || status) && (
        <div className="detailPageHeader">
          <div>
            <span>Record overview</span>
            {recordId && <strong>{recordId}</strong>}
          </div>
          {status && <Pill>{status}</Pill>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ title, children, onClose, className = "" }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <section className={`glass modalPanel ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <Title title={title} />
          <button type="button" className="closeButton" aria-label="Close modal" onClick={onClose}>
            <FaXmark />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ConfirmationDialog({
  title,
  message,
  details,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onCancel}>
      <section className="glass confirmPanel" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="confirmIcon">
          <FaTriangleExclamation />
        </div>
        <div className="confirmCopy">
          <h2 id="confirm-title">{title}</h2>
          <p>{message}</p>
          {details && <b>{details}</b>}
        </div>
        <div className="confirmActions">
          <button type="button" className="secondaryButton" onClick={onCancel}>
            <FaXmark />
            <span>{cancelLabel}</span>
          </button>
          <button type="button" className="dangerConfirmButton" onClick={onConfirm}>
            <FaTrash />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function TransactionList({
  rows,
  empty,
  actionLabel,
  onAction,
  title = "Equipment movement",
  canAction,
  getViewHref,
  onEdit,
  onDelete,
}) {
  const hasAction = Boolean(actionLabel && onAction);
  const hasRowActions = Boolean(getViewHref || onEdit || onDelete);
  const columnCount = 6 + (hasAction ? 1 : 0) + (hasRowActions ? 1 : 0);

  return (
    <section className="glass panel">
      <Title eyebrow="Transactions" title={title} />
      <div className="tableWrap">
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Borrower</th>
                <th>Equipment</th>
                <th>Issued</th>
                <th>Returned</th>
                <th>Status</th>
                {hasAction && <th>Action</th>}
                {hasRowActions && <th>Manage</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((transaction) => {
                const showAction = hasAction && (!canAction || canAction(transaction));
                return (
                  <tr key={transaction.id}>
                    <td className="transactionMobileCell" colSpan={columnCount}>
                      <div className="transactionMobileTop">
                        <div>
                          <span>{transaction.transactionId}</span>
                          <strong>{transaction.equipmentName}</strong>
                          <small>{transaction.borrowerName} · {transaction.inventoryCode}</small>
                        </div>
                        <Pill>{transaction.status}</Pill>
                      </div>
                      <div className="transactionMobileMeta">
                        <span>Issued <b>{formatDate(transaction.transactionDate)}</b></span>
                        <span>Return <b>{formatDate(transaction.returnDate) || "Pending"}</b></span>
                      </div>
                      <div className="transactionMobileActions">
                        {showAction && (
                          <button type="button" className="tableActionButton" onClick={() => onAction(transaction)}>
                            {actionLabel}
                          </button>
                        )}
                        {getViewHref && (
                          <Link className="secondaryButton" href={getViewHref(transaction)}>
                            View details
                          </Link>
                        )}
                        {!getViewHref && hasRowActions && (
                          <RecordActions
                            viewHref={getViewHref?.(transaction)}
                            onEdit={onEdit ? () => onEdit(transaction) : undefined}
                            onDelete={onDelete ? () => onDelete(transaction) : undefined}
                          />
                        )}
                      </div>
                    </td>
                    <td data-label="Transaction">{transaction.transactionId}</td>
                    <td data-label="Borrower">{transaction.borrowerName}<span>{transaction.borrowerPhone}</span></td>
                    <td data-label="Equipment">{transaction.equipmentName}<span>{transaction.inventoryCode}</span></td>
                    <td data-label="Issued">{formatDate(transaction.transactionDate)}</td>
                    <td data-label="Returned">{formatDate(transaction.returnDate) || "Pending"}</td>
                    <td data-label="Status"><Pill>{transaction.status}</Pill></td>
                    {hasAction && (
                      <td data-label="Action">
                        {showAction ? (
                          <button type="button" className="tableActionButton" onClick={() => onAction(transaction)}>
                            {actionLabel}
                          </button>
                        ) : (
                          <span className="mutedCell">Done</span>
                        )}
                      </td>
                    )}
                    {hasRowActions && (
                      <td data-label="Manage">
                        <RecordActions
                          viewHref={getViewHref?.(transaction)}
                          onEdit={onEdit ? () => onEdit(transaction) : undefined}
                          onDelete={onDelete ? () => onDelete(transaction) : undefined}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="emptyText">{empty}</p>
        )}
      </div>
    </section>
  );
}

export const ActionIcons = {
  add: FaPlus,
  check: FaCheck,
};
