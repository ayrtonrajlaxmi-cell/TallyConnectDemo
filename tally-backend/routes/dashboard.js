import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/payables-total", async (req, res) => {
  const { company_guid } = req.query;

  if (!company_guid) {
    return res.status(400).json({ success: false });
  }

  const result = await pool.query(
    `
    SELECT COALESCE(
      SUM(
        CASE
          WHEN is_debit = false THEN amount
          ELSE 0
        END
      ), 0
    ) AS total_payables
    FROM voucher_entries
    WHERE company_guid = $1
    `,
    [company_guid]
  );

  res.json({
    success: true,
    total: Number(result.rows[0].total_payables),
  });
});

export default router;
