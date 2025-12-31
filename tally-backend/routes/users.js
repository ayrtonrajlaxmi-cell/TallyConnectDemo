import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* =========================================================
   SELF ROUTES (MUST COME FIRST)
========================================================= */

/**
 * GET current logged-in user profile
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, username, email, company, role, avatar_url
       FROM users
       WHERE id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/**
 * UPDATE current logged-in user profile
 */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, company, role } = req.body;

    await pool.query(
      `
      UPDATE users
      SET username = $1,
          email = $2,
          company = $3,
          role = $4
      WHERE id = $5
      `,
      [username, email, company, role, userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Profile update failed" });
  }
});

/**
 * GET notification preferences (logged-in user)
 */
router.get("/me/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT notification_preferences
       FROM users
       WHERE id = $1`,
      [userId]
    );

    res.json(result.rows[0]?.notification_preferences || {});
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

/**
 * UPDATE notification preferences (logged-in user)
 */
router.put("/me/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE users
       SET notification_preferences = $1::jsonb
       WHERE id = $2`,
      [req.body, userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save notifications" });
  }
});

import uploadAvatar from "../middleware/uploadAvatar.js";

/**
 * UPLOAD avatar (logged-in user)
 */
router.post(
  "/me/avatar",
  requireAuth,
  uploadAvatar.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await pool.query(
        `UPDATE users
         SET avatar_url = $1
         WHERE id = $2`,
        [avatarUrl, userId]
      );

      res.json({ avatar_url: avatarUrl });
    } catch (err) {
      console.error("Avatar upload failed", err);
      res.status(500).json({ message: "Avatar upload failed" });
    }
  }
);

/* =========================================================
   ADMIN COLLECTION ROUTES
========================================================= */

/**
 * GET all users (ADMIN)
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, username, email, role,
            ledger_permissions,
            vouchers_permissions,
            orders_permissions,
            inventory_permissions,
            dashboard_permissions
     FROM users
     ORDER BY id DESC`
  );

  res.json(result.rows);
});

/**
 * ADMIN creates a user
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { email, password } = req.body;

  const exists = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (exists.rows.length > 0) {
    return res.status(400).json({ message: "User already exists" });
  }

  const username = email.split("@")[0];

  const result = await pool.query(
    `
    INSERT INTO users (username, email, password, role, isadmin)
    VALUES ($1, $2, $3, 'USER', false)
    RETURNING id, username, email
    `,
    [username, email, password]
  );

  res.json({ user: result.rows[0] });
});

/* =========================================================
   ADMIN USER-SPECIFIC ROUTES (MUST BE LAST)
========================================================= */

router.put("/:id/voucher-permissions", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE users SET vouchers_permissions = $1::jsonb WHERE id = $2",
    [req.body, req.params.id]
  );
  res.json({ success: true });
});

router.put("/:id/ledger-permissions", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE users SET ledger_permissions = $1 WHERE id = $2",
    [req.body, req.params.id]
  );
  res.json({ success: true });
});

router.put("/:id/orders-permissions", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE users SET orders_permissions = $1::jsonb WHERE id = $2",
    [req.body, req.params.id]
  );
  res.json({ success: true });
});

router.put("/:id/inventory-permissions", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE users SET inventory_permissions = $1::jsonb WHERE id = $2",
    [req.body, req.params.id]
  );
  res.json({ success: true });
});

router.put("/:id/dashboard-permissions", requireAuth, requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE users SET dashboard_permissions = $1::jsonb WHERE id = $2",
    [req.body, req.params.id]
  );
  res.json({ success: true });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// GET ledgers assigned to a user (ADMIN)


router.get("/:id/ledgers", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT ledger_name
      FROM user_ledger_permissions
      WHERE user_id = $1
      ORDER BY ledger_name
      `,
      [id]
    );

    // ✅ ALWAYS return array
    res.json(result.rows || []);
  } catch (err) {
    console.error("Fetch user ledgers failed", err);

    // ✅ Return empty array instead of error object
    res.json([]);
  }
});



export default router;
