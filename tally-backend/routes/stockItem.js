import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const {
    stock_guid,
    company_guid,
    name,
    unit,
    opening_qty,
    opening_value,
  } = req.body;

  await pool.query(
    `
    INSERT INTO stock_items
    (stock_guid, company_guid, name, unit, opening_qty, opening_value)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (stock_guid)
    DO UPDATE SET
      name = EXCLUDED.name,
      unit = EXCLUDED.unit,
      opening_qty = EXCLUDED.opening_qty,
      opening_value = EXCLUDED.opening_value
    `,
    [
      stock_guid,
      company_guid,
      name,
      unit,
      opening_qty || 0,
      opening_value || 0,
    ]
  );

  res.json({ status: "ok" });
});

export default router;
