import express from "express";
import pool from "../db.js";

const router = express.Router();

/* -------------------------
   SALES ORDER ITEM SYNC
-------------------------- */
router.post("/sync", async (req, res) => {
  try {
    const {
      order_guid,
      item_name,
      quantity,
      rate,
      amount,
    } = req.body;

    await pool.query(
      `
      INSERT INTO sales_order_items
      (
        order_guid,
        item_name,
        quantity,
        rate,
        amount
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [order_guid, item_name, quantity, rate, amount]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Sales Order Item sync error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
