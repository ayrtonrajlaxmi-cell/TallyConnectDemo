import express from "express";
import pool from "../db.js";

const router = express.Router();
router.post("/mark-inactive", async (req, res) => {
  const { activeVoucherGuids } = req.body;

  if (!Array.isArray(activeVoucherGuids)) {
    return res.status(400).json({ success: false });
  }

  try {
    await pool.query(
      `
      UPDATE voucher_entries
      SET is_active = false
      WHERE voucher_guid NOT IN (
        SELECT UNNEST($1::text[])
      )
      `,
      [activeVoucherGuids]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark inactive error:", err.message);
    res.status(500).json({ success: false });
  }
});

/*
router.post("/sync", async (req, res) => {
  const {
    voucher_guid,
    company_guid,
    ledger_name,
    amount,
    is_debit,
    voucher_date,
    voucher_type,
    reference_no,
  } = req.body;

  try {
    await pool.query(
  `
  INSERT INTO voucher_entries
  (
    voucher_guid,
    company_guid,
    ledger_name,
    amount,
    is_debit,
    voucher_date,
    voucher_type,
    reference_no
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  ON CONFLICT (voucher_guid, ledger_name)
  DO UPDATE SET
    amount = EXCLUDED.amount,
    is_debit = EXCLUDED.is_debit,
    voucher_date = EXCLUDED.voucher_date,
    voucher_type = EXCLUDED.voucher_type,
    reference_no = EXCLUDED.reference_no
  `,
  [
    voucher_guid,
    company_guid,
    ledger_name,
    amount,
    is_debit,
    voucher_date,
    voucher_type,
    reference_no,
  ]
);



    res.json({ success: true });
  } catch (err) {
    console.error("Voucher sync error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
*/

router.post("/sync", async (req, res) => {
  const {
    voucher_guid,
    company_guid,
    ledger_name,
    amount,
    is_debit,
    voucher_date,
    voucher_type,
    reference_no,
  } = req.body;

  // ✅ STEP 1: HARD VALIDATION (THIS IS THE FIX)
  if (!company_guid) {
    return res.status(400).json({
      success: false,
      error: "company_guid is required for voucher sync",
    });
  }

  try {
    // ✅ STEP 2: OPTIONAL BUT RECOMMENDED — VALIDATE COMPANY EXISTS
    const companyCheck = await pool.query(
      "SELECT 1 FROM companies WHERE company_guid = $1",
      [company_guid]
    );

    if (companyCheck.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid company_guid",
      });
    }

    // ✅ STEP 3: INSERT / UPDATE (UNCHANGED LOGIC)
    await pool.query(
      `
      INSERT INTO voucher_entries
      (
        voucher_guid,
        company_guid,
        ledger_name,
        amount,
        is_debit,
        voucher_date,
        voucher_type,
        reference_no
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (voucher_guid, ledger_name)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        is_debit = EXCLUDED.is_debit,
        voucher_date = EXCLUDED.voucher_date,
        voucher_type = EXCLUDED.voucher_type,
        reference_no = EXCLUDED.reference_no
      `,
      [
        voucher_guid,
        company_guid,
        ledger_name,
        amount,
        is_debit,
        voucher_date,
        voucher_type,
        reference_no,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Voucher sync error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET VOUCHER LIST (AGGREGATED FOR UI)
// ✅ GET VOUCHER LIST (ROLE & PERMISSION AWARE)
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query;
    let params = [];

    if (role === "ADMIN") {
      // ✅ ADMIN: see ALL vouchers
      query = `
        SELECT
          ve.voucher_guid,
          ve.voucher_date,
          ve.voucher_type,
          MAX(ve.reference_no) AS reference_no,

          MAX(
            CASE
              WHEN ve.is_debit = false THEN ve.ledger_name
              ELSE NULL
            END
          ) AS party_name,

          SUM(ve.amount) AS amount,
          BOOL_OR(ve.is_active) AS is_active

        FROM voucher_entries ve
        GROUP BY
          ve.voucher_guid,
          ve.voucher_date,
          ve.voucher_type
        ORDER BY ve.voucher_date DESC
      `;
    } else {
      // ✅ USER: only vouchers linked to allowed ledgers
      query = `
        SELECT
          ve.voucher_guid,
          ve.voucher_date,
          ve.voucher_type,
          MAX(ve.reference_no) AS reference_no,

          MAX(
            CASE
              WHEN ve.is_debit = false THEN ve.ledger_name
              ELSE NULL
            END
          ) AS party_name,

          SUM(ve.amount) AS amount,
          BOOL_OR(ve.is_active) AS is_active

        FROM voucher_entries ve
        WHERE EXISTS (
          SELECT 1
          FROM user_ledger_permissions ulp
          WHERE ulp.user_id = $1
          AND ulp.ledger_name = ve.ledger_name
        )
        GROUP BY
          ve.voucher_guid,
          ve.voucher_date,
          ve.voucher_type
        ORDER BY ve.voucher_date DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error("Voucher GET error:", err);
    res.status(500).json({ success: false });
  }
});


export default router;
