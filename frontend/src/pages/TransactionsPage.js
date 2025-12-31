import { useEffect, useState } from "react";
import axios from "axios";

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:4000/voucher");
      setTransactions(res.data.vouchers || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h4>💰 Vouchers (Auto-update every 5 sec)</h4>

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Date</th>
            <th>Voucher No</th>
            <th>Type</th>
            <th>Ledger</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id}>
              <td>{txn.date}</td>
              <td>{txn.voucher_number}</td>
              <td>{txn.voucher_type}</td>
              <td>{txn.ledger_name}</td>
              <td>{txn.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionsPage;
