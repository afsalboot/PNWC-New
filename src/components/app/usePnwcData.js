"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./constants";

export function usePnwcData() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({});
  const [borrowers, setBorrowers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);

  const loadData = useCallback(async function loadData() {
    setLoading(true);
    try {
      const [dashboard, borrowerRows, equipmentRows, transactionRows, userRows] = await Promise.all([
        api("/api/dashboard"),
        api("/api/borrowers"),
        api("/api/equipment"),
        api("/api/transactions"),
        api("/api/users").catch(() => []),
      ]);
      setStats(dashboard);
      setBorrowers(borrowerRows);
      setEquipment(equipmentRows);
      setTransactions(transactionRows);
      setUsers(userRows);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  return {
    loading,
    message,
    setMessage,
    stats,
    borrowers,
    equipment,
    transactions,
    users,
    loadData,
  };
}
