import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { bill_guid, ledger_guid, company_guid, bill_name, bill_type, amount, due_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO bills 
      (bill_guid, ledger_guid, company_guid, bill_name, bill_type, amount, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (bill_guid) DO UPDATE 
         SET bill_name=$4, 
             bill_type=$5, 
             amount=$6,
             due_date=$7
       RETURNING *`,
      [bill_guid, ledger_guid, company_guid, bill_name, bill_type, amount, due_date]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Fetch all bills
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bills ORDER BY due_date ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
