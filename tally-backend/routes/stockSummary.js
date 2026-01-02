import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * -----------------------------------
 * POST /stock-summary/sync
 * Called by agent.js
 * -----------------------------------
 */
router.post("/sync", async (req, res) => {
  try {
    console.log("📥 stock-summary/sync HIT:", req.body);

    const {
      company_guid,
      item_name,
      closing_qty,
      closing_value
    } = req.body;

    if (!company_guid || !item_name) {
      return res.status(400).json({
        success: false,
        message: "company_guid and item_name are required"
      });
    }

    await pool.query(
      `
      INSERT INTO stock_summary (
        company_guid,
        item_name,
        closing_qty,
        closing_value
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (company_guid, item_name)
      DO UPDATE SET
        closing_qty = EXCLUDED.closing_qty,
        closing_value = EXCLUDED.closing_value,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        company_guid,
        item_name,
        closing_qty || 0,
        closing_value || 0
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ stock-summary/sync error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
