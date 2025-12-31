import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * GET /api/reports/monthly-summary?year=2025
 */
router.get("/monthly-summary", async (req, res) => {
  try {
    const yearParam = req.query.year;

    // 1️⃣ Validate year
    if (!yearParam) {
      return res.status(400).json({ message: "Year query param missing" });
    }

    const year = parseInt(yearParam, 10);
    if (isNaN(year)) {
      return res.status(400).json({ message: "Year must be a valid number" });
    }

    // 2️⃣ Query: generate all 12 months + left join vouchers
    const query = `
      WITH months AS (
        SELECT
          generate_series(
            make_date($1, 1, 1),
            make_date($1, 12, 1),
            interval '1 month'
          ) AS month_start
      )
      SELECT
        TO_CHAR(m.month_start, 'Mon') AS month,
        EXTRACT(MONTH FROM m.month_start) AS month_no,

        -- Turnover (Sales)
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(v.voucher_type) LIKE '%sales%'
              THEN v.amount::numeric
              ELSE 0
            END
          ), 0
        ) AS turnover,

        -- Expense (Purchase + Expense + Payment)
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(v.voucher_type) LIKE '%purchase%'
                OR LOWER(v.voucher_type) LIKE '%expense%'
                OR LOWER(v.voucher_type) = 'payment'
              THEN v.amount::numeric
              ELSE 0
            END
          ), 0
        ) AS expense

      FROM months m
      LEFT JOIN voucher_entries v
        ON DATE_TRUNC('month', v.voucher_date) = m.month_start
        AND EXTRACT(YEAR FROM v.voucher_date) = $1

      GROUP BY m.month_start
      ORDER BY month_no;
    `;

    const { rows } = await pool.query(query, [year]);

    // 3️⃣ Format response
    const data = rows.map(row => {
      const turnover = Number(row.turnover) || 0;
      const expense = Number(row.expense) || 0;

      return {
        month: row.month.trim(),
        turnover,
        expense,
        profit: turnover - expense,
      };
    });

    res.json(data);
  } catch (error) {
    console.error("Monthly summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;