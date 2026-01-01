import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config/api";

export function LedgerSelectionPermissions({
  user,
  onDone,
}: {
  user: any;
  onDone: () => void;
}) {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 🔹 ADDED: search state
  const [search, setSearch] = useState("");

  /* 🔹 LOAD ALL LEDGERS AS ADMIN */
  useEffect(() => {
    const fetchLedgers = async () => {
const res = await axios.get(`${API_URL}/ledger`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLedgers(res.data.data || []);
    };
    fetchLedgers();
  }, []);

  /* 🔹 TOGGLE SINGLE */
  const toggleLedger = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  /* 🔹 TOGGLE ALL */
  const toggleAll = () => {
    if (selected.size === ledgers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ledgers.map((l) => l.name)));
    }
  };

  /* 🔹 SAVE */
  const save = async () => {
await fetch(`${API_URL}/ledger/user-ledgers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        userId: user.id,
        ledgers: [...selected],
      }),
    });
    onDone();
  };

  useEffect(() => {
    const fetchUserLedgers = async () => {
      const res = await fetch(
        `${API_URL}/users/${user.id}/ledgers`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      setSelected(new Set(data.map((l: any) => l.ledger_name)));
    };

    fetchUserLedgers();
  }, [user.id]);

  // 🔹 ADDED: filter ledgers by search
  const filteredLedgers = ledgers.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* HEADER WITH SEARCH + SAVE + TOGGLE ALL */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ledger Access</h3>

        <div className="flex items-center gap-4">
          {/* 🔹 ADDED: SEARCH BAR (LEFT OF SAVE) */}
          <input
            type="text"
            placeholder="Search ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1 text-sm border rounded
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={save}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Save
          </button>

          <button
            onClick={toggleAll}
            className="text-sm underline"
          >
            Toggle All
          </button>
        </div>
      </div>

      {/* LEDGER LIST */}
      <div className="border rounded divide-y">
        {filteredLedgers.map((l) => (
          <div
            key={l.ledger_guid}
            className="flex items-center justify-between px-4 py-3"
          >
            <span>{l.name}</span>
            <input
              type="checkbox"
              checked={selected.has(l.name)}
              onChange={() => toggleLedger(l.name)}
            />
          </div>
        ))}

        {/* OPTIONAL EMPTY STATE */}
        {filteredLedgers.length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-500 text-center">
            No ledgers found
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="text-sm">
        Selected: {selected.size}
      </div>
    </div>
  );
}