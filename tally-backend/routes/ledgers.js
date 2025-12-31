import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

// Sync ledger (Insert/Update)
router.post("/sync", async (req, res) => {
  const {
    ledger_guid,
    company_guid,
    name,
    parent_group,
    opening_balance,
    closing_balance,
    type,
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO ledgers
      (
        ledger_guid,
        company_guid,
        name,
        parent_group,
        opening_balance,
        closing_balance,
        type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (ledger_guid)
      DO UPDATE SET
        name = EXCLUDED.name,
        parent_group = EXCLUDED.parent_group,
        opening_balance = EXCLUDED.opening_balance,
        closing_balance = EXCLUDED.closing_balance,
        type = EXCLUDED.type
      RETURNING *
      `,
      [
        ledger_guid,
        company_guid,
        name,
        parent_group,
        opening_balance || 0,
        closing_balance || 0,
        type || "General",
       // voucher_date,
  //voucher_type,
  //reference_no,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Ledger sync error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Fetch all ledgers
// Fetch ledgers based on logged-in user permissions
router.get("/", async (req, res) => {

  try {
    const userId = req.user.id;
    const role = req.user.role; // 👈 REQUIRED

    let query;
    let params = [];

    if (role === "ADMIN") {
      // ✅ ADMIN: see everything
      query = `
        SELECT
          l.ledger_guid,
          l.name,
          l.parent_group,
          l.type,
          l.opening_balance,

          COALESCE(SUM(CASE WHEN ve.is_debit THEN ve.amount ELSE 0 END), 0) AS debit,
          COALESCE(SUM(CASE WHEN NOT ve.is_debit THEN ve.amount ELSE 0 END), 0) AS credit,

          (
            l.opening_balance
            + COALESCE(SUM(CASE WHEN ve.is_debit THEN ve.amount ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN NOT ve.is_debit THEN ve.amount ELSE 0 END), 0)
          ) AS closing_balance,

          MAX(ve.voucher_date) AS date,
          MAX(ve.voucher_type) AS voucher_type,
          MAX(ve.reference_no) AS reference_no

        FROM ledgers l
        LEFT JOIN voucher_entries ve
          ON ve.ledger_name = l.name
         AND ve.company_guid = l.company_guid
         AND ve.is_active = true

        WHERE l.company_guid = (
          SELECT company_guid FROM active_company WHERE id = 1
        )

        GROUP BY
          l.ledger_guid,
          l.name,
          l.parent_group,
          l.type,
          l.opening_balance

        ORDER BY l.name ASC
      `;
    } else {
      // ✅ USER: permission-based
      query = `
        SELECT
          l.ledger_guid,
          l.name,
          l.parent_group,
          l.type,
          l.opening_balance,

          COALESCE(SUM(CASE WHEN ve.is_debit THEN ve.amount ELSE 0 END), 0) AS debit,
          COALESCE(SUM(CASE WHEN NOT ve.is_debit THEN ve.amount ELSE 0 END), 0) AS credit,

          (
            l.opening_balance
            + COALESCE(SUM(CASE WHEN ve.is_debit THEN ve.amount ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN NOT ve.is_debit THEN ve.amount ELSE 0 END), 0)
          ) AS closing_balance,

          MAX(ve.voucher_date) AS date,
          MAX(ve.voucher_type) AS voucher_type,
          MAX(ve.reference_no) AS reference_no

        FROM ledgers l
        LEFT JOIN voucher_entries ve
          ON ve.ledger_name = l.name
         AND ve.company_guid = l.company_guid
         AND ve.is_active = true

        WHERE l.company_guid = (
          SELECT company_guid FROM active_company WHERE id = 1
        )
        AND EXISTS (
          SELECT 1
          FROM user_ledger_permissions ulp
          WHERE ulp.user_id = $1
          AND ulp.ledger_name = l.name
        )

        GROUP BY
          l.ledger_guid,
          l.name,
          l.parent_group,
          l.type,
          l.opening_balance

        ORDER BY l.name ASC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Ledger fetch error:", err);
    res.status(500).json({ success: false });
  }
});

/*

router.post("/user-ledgers", async (req, res) => {
  

  const { userId, ledgers } = req.body;

  try {
    await pool.query(
      "DELETE FROM user_ledger_permissions WHERE user_id = $1",
      [userId]
    );

    for (const ledger of ledgers) {
      await pool.query(
        `INSERT INTO user_ledger_permissions (user_id, ledger_name)
         VALUES ($1, $2)`,
        [userId, ledger]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/user-ledgers", async (req, res) => {
  console.log("🔥 user-ledgers payload:", req.body);

  const { userId, ledgers } = req.body;

  try {
    await pool.query(
      "DELETE FROM user_ledger_permissions WHERE user_id = $1",
      [userId]
    );

    for (const ledger of ledgers) {
      await pool.query(
        `INSERT INTO user_ledger_permissions (user_id, ledger_name)
         VALUES ($1, $2)`,
        [userId, ledger]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Save ledger permissions failed:", err);
    res.status(500).json({ error: err.message });
  }
});

*/


router.post(
  "/user-ledgers",
  requireAuth,
  async (req, res) => {

    console.log("🟢 user-ledgers called");
    console.log("👉 req.user:", req.user);
    console.log("👉 req.body:", req.body);

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { userId, ledgers } = req.body;

    if (!userId || !Array.isArray(ledgers)) {
      return res.status(400).json({
        message: "Invalid payload",
        received: req.body,
      });
    }

    try {
      await pool.query(
        "DELETE FROM user_ledger_permissions WHERE user_id = $1",
        [userId]
      );

      for (const ledger of ledgers) {
        await pool.query(
          `INSERT INTO user_ledger_permissions (user_id, ledger_name)
           VALUES ($1, $2)`,
          [userId, ledger]
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Save user-ledgers failed:", err);
      res.status(500).json({ error: err.message });
    }
  }
);



router.post(
  "/assign-ledgers",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { userId, ledgers } = req.body;

    try {
      await pool.query(
        "DELETE FROM user_ledger_permissions WHERE user_id = $1",
        [userId]
      );

      for (const ledger of ledgers) {
        await pool.query(
          `INSERT INTO user_ledger_permissions (user_id, ledger_name)
           VALUES ($1, $2)`,
          [userId, ledger]
        );
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
