import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { ledger_guid, company_guid, period, amount } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ageing 
       (ledger_guid, company_guid, period, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ledger_guid, company_guid, period, amount]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Fetch ageing data
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ageing ORDER BY period ASC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

export default router;
