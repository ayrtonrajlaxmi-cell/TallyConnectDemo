import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * -----------------------------------
 * Inventory API
 * GET /inventory
 * -----------------------------------
 */
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        row_number() OVER () AS id,
        ss.item_name        AS name,
        0                   AS opening,
        0                   AS inward,
        0                   AS outward,
        ss.closing_qty      AS closing,
        CASE
          WHEN ss.closing_qty <> 0
          THEN ROUND(ss.closing_value / ss.closing_qty, 2)
          ELSE 0
        END                 AS rate,
        10                  AS "minStock"
      FROM stock_summary ss
      WHERE ss.company_guid::text = (
        SELECT company_guid::text
        FROM active_company
        WHERE id = 1
      )
      ORDER BY ss.item_name;
    `);

    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});





export default router;
