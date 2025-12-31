import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  try {
    const {
      invoice_guid,
      company_guid,
      invoice_no,
      invoice_date,
      invoice_type,
      party_name,
      total_amount,
    } = req.body;

    await pool.query(
      `
      INSERT INTO invoices
      (invoice_guid, company_guid, invoice_no, invoice_date, invoice_type, party_name, total_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (invoice_guid) DO NOTHING
      `,
      [
        invoice_guid,
        company_guid,
        invoice_no,
        invoice_date,
        invoice_type,
        party_name,
        total_amount,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Invoice sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
