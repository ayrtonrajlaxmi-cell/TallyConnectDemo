import express from "express";
import pool from "../db.js";

const router = express.Router();

/* -------------------------
   GET ORDER BOOK
-------------------------- */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        order_guid AS id,
        'Sales' AS type,
        order_date AS date,
        party_name AS customer,
        total_amount AS amount,
        due_date,
        status
      FROM sales_orders
      WHERE company_guid = (
        SELECT company_guid FROM active_company WHERE id = 1
      )
      ORDER BY order_date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("Order fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



export default router;
