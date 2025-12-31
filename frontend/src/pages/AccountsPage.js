import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

function AccountsPage({ userRole = "viewer" }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // =========================
  // Fetch data
  // =========================
  const fetchAccounts = async () => {
    try {
      const res = await axios.get("http://localhost:4000/ledger");
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  // =========================
  // Summary
  // =========================
  const totalDebit = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.debit || 0), 0),
    [accounts]
  );

  const totalCredit = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.credit || 0), 0),
    [accounts]
  );

  const netBalance = totalDebit - totalCredit;

  // =========================
  // Search
  // =========================
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) =>
      [
        a.name,
        a.parent_group,
        a.type,
        a.voucher_type,
        a.reference_no,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [accounts, search]);

  // =========================
  // Sorting
  // =========================
  const sortBy = (key) => {
    setSortDir(sortKey === key && sortDir === "asc" ? "desc" : "asc");
    setSortKey(key);
  };

  const sortedAccounts = useMemo(() => {
    if (!sortKey) return filteredAccounts;
    return [...filteredAccounts].sort((a, b) => {
      const x = Number(a[sortKey] || 0);
      const y = Number(b[sortKey] || 0);
      return sortDir === "asc" ? x - y : y - x;
    });
  }, [filteredAccounts, sortKey, sortDir]);

  // =========================
  // Export CSV
  // =========================
  const exportCSV = () => {
    if (!accounts.length) return;
    const headers = [
      "Party Name","Parent Group","Ledger Type","Opening Balance",
      "Outstanding","Due Days","Date","Voucher Type",
      "Reference No","Debit","Credit","Balance"
    ];
    const rows = accounts.map((a) => [
      a.name,a.parent_group,a.type,a.opening_balance,a.outstanding,
      a.due_days,a.date,a.voucher_type,a.reference_no,a.debit,
      a.credit,a.closing_balance
    ]);
    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ledger.csv";
    link.click();
  };

  // =========================
  // Inline edit handler
  // =========================
  const handleEdit = (id, key, value) => {
    if (userRole !== "admin") return;
    setAccounts((prev) =>
      prev.map((a) => (a.ledger_guid === id ? { ...a, [key]: value } : a))
    );
  };

  return (
    <div className={`container-fluid py-3 ${darkMode ? "bg-dark text-light" : ""}`}>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4>📁 Ledger List <span className="badge bg-secondary ms-2">Auto refresh 5s</span></h4>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-sm btn-outline-primary" onClick={exportCSV}>⬇ Export</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="row g-3 mb-3">
        <SummaryCard title="Total Debit" value={totalDebit} color="success" />
        <SummaryCard title="Total Credit" value={totalCredit} color="danger" />
        <SummaryCard title="Net Balance" value={netBalance} color={netBalance < 0 ? "danger" : "primary"} />
        <SummaryCard title="Total Records" value={accounts.length} />
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-bordered table-sm table-hover align-middle mb-0">
          <thead className="table-dark text-nowrap sticky-top">
            <tr>
              <StickyTH>Party Name</StickyTH>
              <th>Parent Group</th>
              <th>Ledger Type</th>
              <SortableTH label="Opening Balance" onClick={() => sortBy("opening_balance")} />
              <SortableTH label="Outstanding" onClick={() => sortBy("outstanding")} />
              <th>Due Days</th>
              <th>Date</th>
              <th>Voucher Type</th>
              <th>Reference No</th>
              <SortableTH label="Debit" onClick={() => sortBy("debit")} />
              <SortableTH label="Credit" onClick={() => sortBy("credit")} />
              <SortableTH label="Balance" onClick={() => sortBy("closing_balance")} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="12" className="text-center py-4">⏳ Loading...</td></tr>
            )}
            {!loading && sortedAccounts.length === 0 && (
              <tr><td colSpan="12" className="text-center py-4 text-muted">No records found</td></tr>
            )}
            {!loading && sortedAccounts.length > 0 && (
              sortedAccounts.map((acc) => (
                <tr
                  key={acc.ledger_guid}
                  onClick={() => setSelectedRow(acc)}
                  className={
                    acc.closing_balance < 0
                      ? "table-danger"
                      : acc.outstanding > 0
                      ? "table-warning"
                      : ""
                  }
                >
                  <StickyTD>{acc.name}</StickyTD>
                  <td>{acc.parent_group}</td>
                  <td>
                    <input
                      value={acc.type || ""}
                      onChange={(e) => handleEdit(acc.ledger_guid, "type", e.target.value)}
                      disabled={userRole !== "admin"}
                      className="form-control form-control-sm"
                    />
                  </td>
                  <NumericTD>
                    <input
                      value={acc.opening_balance || 0}
                      onChange={(e) => handleEdit(acc.ledger_guid, "opening_balance", e.target.value)}
                      disabled={userRole !== "admin"}
                      className="form-control form-control-sm text-end"
                    />
                  </NumericTD>
                  <NumericTD>{acc.outstanding}</NumericTD>
                  <td>{acc.due_days || "-"}</td>
                  <td>{acc.date || "-"}</td>
                  <td>{acc.voucher_type || "-"}</td>
                  <EllipsisTD value={acc.reference_no} />
                  <td className="text-end text-success">{acc.debit || 0}</td>
                  <td className="text-end text-danger">{acc.credit || 0}</td>
                  <td className="text-end fw-bold">{acc.closing_balance || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedRow && (
        <VoucherModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
}

/* -------------------------
   REUSABLE COMPONENTS
-------------------------- */
const SummaryCard = ({ title, value, color = "dark" }) => (
  <div className="col-md-3">
    <div className="card shadow-sm">
      <div className="card-body">
        <small className="text-muted">{title}</small>
        <h5 className={`mb-0 text-${color}`}>{Number(value || 0).toLocaleString()}</h5>
      </div>
    </div>
  </div>
);

const SortableTH = ({ label, onClick }) => <th style={{cursor:"pointer"}} onClick={onClick}>{label} ↕</th>;
const StickyTH = ({ children }) => <th style={{position:"sticky", left:0, background:"#212529", zIndex:3}}>{children}</th>;
const StickyTD = ({ children }) => <td style={{position:"sticky", left:0, background:"#fff", fontWeight:600, zIndex:1}}>{children}</td>;
const NumericTD = ({ children }) => <td className="text-end">{Number(children || 0).toLocaleString()}</td>;
const EllipsisTD = ({ value }) => <td title={value} style={{maxWidth:140, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{value || "-"}</td>;
const VoucherModal = ({ row, onClose }) => (
  <div className="modal d-block bg-dark bg-opacity-50">
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Voucher Details</h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          <pre className="mb-0">{JSON.stringify(row, null, 2)}</pre>
        </div>
      </div>
    </div>
  </div>
);

export default AccountsPage;
