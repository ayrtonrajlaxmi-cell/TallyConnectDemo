import express from "express";
import pool from "../db.js";

const router = express.Router();

/* -------------------------
   SALES ORDER HEADER SYNC
-------------------------- */
router.post("/sync", async (req, res) => {
  try {
    const {
      order_guid,
      company_guid,
      order_no,
      order_date,
      party_name,
      voucher_type,
      total_amount,
    } = req.body;

    await pool.query(
      `
      INSERT INTO sales_orders
      (
        order_guid,
        company_guid,
        order_no,
        order_date,
        party_name,
        voucher_type,
        total_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (order_guid)
      DO UPDATE SET
        order_no = EXCLUDED.order_no,
        order_date = EXCLUDED.order_date,
        party_name = EXCLUDED.party_name,
        total_amount = EXCLUDED.total_amount
      `,
      [
        order_guid,
        company_guid,
        order_no,
        order_date,
        party_name,
        voucher_type,
        total_amount,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Sales Order sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
