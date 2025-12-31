import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  try {
    const {
      invoice_guid,
      item_name,
      quantity,
      rate,
      amount,
    } = req.body;

    await pool.query(
      `
      INSERT INTO invoice_items
      (invoice_guid, item_name, quantity, rate, amount)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [invoice_guid, item_name, quantity, rate, amount]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Invoice item sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
