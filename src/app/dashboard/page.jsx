"use client";

import { useState } from "react";
import { FaBoxesStacked, FaChartPie, FaClockRotateLeft, FaScrewdriverWrench, FaUserCheck, FaUsers } from "react-icons/fa6";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/components/app/constants";
import { AppLayout, StatWithIcon } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const data = usePnwcData();
  const { loading, message, stats, equipment } = data;
  const activeTransactions = data.transactions.filter((transaction) => transaction.status === "Active");
  const returnedTransactions = data.transactions.filter((transaction) => transaction.status === "Returned");
  const stockTotal = equipment.reduce((sum, item) => sum + Number(item.totalStock || 0), 0);
  const stockAvailable = equipment.reduce((sum, item) => sum + Number(item.availableStock || 0), 0);
  const utilization = stockTotal ? Math.round(((stockTotal - stockAvailable) / stockTotal) * 100) : 0;
  const returnRate = data.transactions.length ? Math.round((returnedTransactions.length / data.transactions.length) * 100) : 0;
  const repairQueue = equipment.filter((item) => item.status === "Maintenance" || item.condition === "Repair Needed");
  const latestReturns = returnedTransactions.slice(0, 4);
  const inventoryChartData = buildInventoryChartData(equipment);
  const movementChartData = buildMovementChartData(data.transactions);
  const statusChartData = buildStatusChartData(equipment);
  const topBorrowedChartData = buildTopBorrowedChartData(data.transactions);
  const topBorrowerChartData = buildTopBorrowerChartData(data.transactions);
  const conditionChartData = buildConditionChartData(equipment);
  const categoryPressureChartData = buildCategoryPressureChartData(equipment);
  const returnCompletionChartData = buildReturnCompletionChartData(equipment, data.transactions);

  return (
    <AppLayout activeView="Home" search={search} onSearch={setSearch} loading={loading} message={message}>
      <div className="statsGrid">
        <StatWithIcon label="Total Equipment" value={stats.totalEquipment || 0} icon={FaBoxesStacked} />
        <StatWithIcon label="Available Stock" value={stockAvailable || stats.availableEquipment || 0} icon={FaUserCheck} tone="blue" />
        <StatWithIcon label="Active Issues" value={stats.activeTransactions || 0} icon={FaClockRotateLeft} tone="gold" />
        <StatWithIcon label="Utilization" value={`${utilization}%`} icon={FaChartPie} tone="blue" />
        <StatWithIcon label="Borrowers" value={stats.totalBorrowers || 0} icon={FaUsers} />
        <StatWithIcon label="Returns Completed" value={stats.returnedEquipment || 0} icon={FaClockRotateLeft} />
        <StatWithIcon label="Return Rate" value={`${returnRate}%`} icon={FaChartPie} tone="gold" />
        <StatWithIcon label="Repair Queue" value={repairQueue.length || stats.maintenanceEquipment || 0} icon={FaScrewdriverWrench} tone="danger" />
      </div>
      <div className="dashboardGrid">
        <section className="glass panel">
          <div className="sectionTitle">
            <div>
              <span className="eyebrow">Open work</span>
              <h2>Active issues</h2>
            </div>
          </div>
          <div className="compactList">
            {activeTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id}>
                <b>{transaction.equipmentName}</b>
                <span>{transaction.borrowerName} - {formatDate(transaction.transactionDate)}</span>
              </div>
            ))}
            {!activeTransactions.length && <p className="emptyText">No active issues right now.</p>}
          </div>
        </section>
        <section className="glass panel">
          <div className="sectionTitle">
            <div>
              <span className="eyebrow">Closed work</span>
              <h2>Recent returns</h2>
            </div>
          </div>
          <div className="compactList">
            {latestReturns.map((transaction) => (
              <div key={transaction.id}>
                <b>{transaction.equipmentName}</b>
                <span>{transaction.borrowerName} - {formatDate(transaction.returnDate)}</span>
              </div>
            ))}
            {!latestReturns.length && <p className="emptyText">Returned equipment will appear here once handovers close.</p>}
          </div>
        </section>
      </div>
      <div className="analyticsGrid">
        <ChartPanel eyebrow="Inventory chart" title="Stock by category" empty="Add equipment to see stock distribution." hasData={inventoryChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15, 143, 132, 0.08)" }} />
              <Legend iconType="circle" wrapperStyle={{ color: "#637371", fontWeight: 900, fontSize: 12 }} />
              <Bar dataKey="total" name="Total" fill="#2767d8" radius={[10, 10, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#0f8f84" radius={[10, 10, 0, 0]} />
              <Bar dataKey="lent" name="Lent" fill="#e76f51" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Movement trend" title="Lending and returns" empty="Transactions will appear here after lending equipment." hasData={movementChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movementChartData} margin={{ top: 8, right: 14, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(15, 143, 132, 0.18)" }} />
              <Legend iconType="circle" wrapperStyle={{ color: "#637371", fontWeight: 900, fontSize: 12 }} />
              <Line type="monotone" dataKey="lent" name="Lent" stroke="#2767d8" strokeWidth={3} dot={{ r: 4, fill: "#2767d8" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="returned" name="Returned" stroke="#0f8f84" strokeWidth={3} dot={{ r: 4, fill: "#0f8f84" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Status mix" title="Equipment health" empty="Add equipment to see status mix." hasData={statusChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={4}>
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ color: "#637371", fontWeight: 900, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Demand" title="Top borrowed equipment" empty="Lending records will build demand analytics." hasData={topBorrowedChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBorrowedChartData} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(15, 143, 132, 0.08)" }} />
              <Bar dataKey="count" name="Times lent" fill="#7457d9" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Borrowers" title="Top borrower demand" empty="Borrower demand appears after transactions are added." hasData={topBorrowerChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBorrowerChartData} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(39, 103, 216, 0.08)" }} />
              <Bar dataKey="count" name="Items lent" fill="#2767d8" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Condition" title="Equipment condition mix" empty="Add equipment to see condition analytics." hasData={conditionChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={conditionChartData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="76%" paddingAngle={4}>
                {conditionChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ color: "#637371", fontWeight: 900, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Utilization" title="Category pressure" empty="Stock pressure appears when equipment is lent." hasData={categoryPressureChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryPressureChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value) => `${value}%`} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "rgba(231, 111, 81, 0.08)" }} />
              <Bar dataKey="pressure" name="Lent stock" fill="#e76f51" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel eyebrow="Returns" title="Completion by category" empty="Return completion appears after lending and returns." hasData={returnCompletionChartData.length}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={returnCompletionChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17, 24, 24, 0.08)" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={(value) => `${value}%`} tick={{ fill: "#637371", fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "rgba(15, 143, 132, 0.08)" }} />
              <Bar dataKey="completion" name="Returned" fill="#0f8f84" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </AppLayout>
  );
}

function ChartPanel({ title, empty, hasData, children }) {
  return (
    <section className="glass panel chartPanel">
      <div className="sectionTitle">
        <div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="chartShell">
        {hasData ? children : <p className="emptyText">{empty}</p>}
      </div>
    </section>
  );
}

function buildInventoryChartData(equipment) {
  const grouped = equipment.reduce((data, item) => {
    const category = item.category || "Other";
    const total = Number(item.totalStock || 0);
    const available = Number(item.availableStock || 0);
    const current = data.get(category) || { category, total: 0, available: 0, lent: 0 };
    current.total += total;
    current.available += available;
    current.lent += Math.max(total - available, 0);
    data.set(category, current);
    return data;
  }, new Map());

  return [...grouped.values()].sort((a, b) => b.total - a.total).slice(0, 8);
}

function buildMovementChartData(transactions) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months = new Map();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    months.set(key, { month: monthNames[date.getMonth()], lent: 0, returned: 0 });
  }

  transactions.forEach((transaction) => {
    addMonthCount(months, transaction.transactionDate, "lent");
    addMonthCount(months, transaction.returnDate, "returned");
  });

  return [...months.values()].filter((row) => row.lent || row.returned);
}

function addMonthCount(months, value, key) {
  if (!value) return;
  const date = new Date(value);
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
  const row = months.get(monthKey);
  if (row) row[key] += 1;
}

function buildStatusChartData(equipment) {
  const colors = {
    Available: "#0f8f84",
    Rented: "#2767d8",
    Maintenance: "#be4141",
    Other: "#7457d9",
  };
  const grouped = equipment.reduce((data, item) => {
    const name = item.status || "Other";
    data.set(name, (data.get(name) || 0) + 1);
    return data;
  }, new Map());

  return [...grouped.entries()].map(([name, value]) => ({ name, value, color: colors[name] || colors.Other }));
}

function buildTopBorrowedChartData(transactions) {
  const grouped = transactions.reduce((data, transaction) => {
    const name = transaction.equipmentName || "Equipment";
    data.set(name, (data.get(name) || 0) + Number(transaction.quantity || 1));
    return data;
  }, new Map());

  return [...grouped.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function buildTopBorrowerChartData(transactions) {
  const grouped = transactions.reduce((data, transaction) => {
    const name = transaction.borrowerName || "Borrower";
    data.set(name, (data.get(name) || 0) + Number(transaction.quantity || 1));
    return data;
  }, new Map());

  return [...grouped.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function buildConditionChartData(equipment) {
  const colors = {
    Excellent: "#2767d8",
    Good: "#0f8f84",
    Fair: "#b9861d",
    "Repair Needed": "#be4141",
    Other: "#7457d9",
  };
  const grouped = equipment.reduce((data, item) => {
    const name = item.condition || "Other";
    data.set(name, (data.get(name) || 0) + 1);
    return data;
  }, new Map());

  return [...grouped.entries()].map(([name, value]) => ({ name, value, color: colors[name] || colors.Other }));
}

function buildCategoryPressureChartData(equipment) {
  return buildInventoryChartData(equipment)
    .map((item) => ({
      category: item.category,
      pressure: item.total ? Math.round((item.lent / item.total) * 100) : 0,
    }))
    .filter((item) => item.pressure > 0)
    .sort((a, b) => b.pressure - a.pressure);
}

function buildReturnCompletionChartData(equipment, transactions) {
  const equipmentCategoryById = new Map(equipment.map((item) => [item.id, item.category || "Other"]));
  const grouped = transactions.reduce((data, transaction) => {
    const category = equipmentCategoryById.get(transaction.equipmentId) || "Other";
    const current = data.get(category) || { category, total: 0, returned: 0 };
    current.total += 1;
    if (transaction.status === "Returned") current.returned += 1;
    data.set(category, current);
    return data;
  }, new Map());

  return [...grouped.values()]
    .map((item) => ({
      category: item.category,
      completion: item.total ? Math.round((item.returned / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 8);
}

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chartTooltip">
      <b>{label}</b>
      {payload.map((item) => (
        <span key={item.dataKey || item.name}>
          <i style={{ background: item.color }} />
          {item.name}: {item.value}{suffix}
        </span>
      ))}
    </div>
  );
}
