import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import requireAuth from "../middleware/requireAuth.js";


const router = express.Router();
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};


// ----------------------
// REGISTER
// ----------------------
router.post("/register", async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  try {
    const exists = await pool.query(
      "SELECT * FROM users WHERE username=$1 OR email=$2",
      [username, email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    const role = isAdmin ? "ADMIN" : "USER";

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, isadmin, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, username, email, role`,
      [username, email, password, isAdmin || false, role]
    );

    res.json({ message: "Registration successful", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ----------------------
// LOGIN
// ----------------------
// ----------------------
// LOGIN (JWT ENABLED)
// ----------------------
router.post("/login", async (req, res) => {
  const { username, password, loginType } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, username, email, password, role,
              ledger_permissions,
              vouchers_permissions,
              orders_permissions,
              inventory_permissions,
              dashboard_permissions
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Plain password check (bcrypt later)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Admin login guard
    if (loginType === "ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not an admin" });
    }

    // 🔑 IMPORTANT: token must be created BEFORE using it
    const token = generateToken(user);

    // ✅ Send response AFTER token exists
    const isAdmin = user.role === "ADMIN";

return res.json({
  token,
  user: {
    id: user.id,
    username: user.username,
    role: user.role,

    ledgerPermissions: isAdmin
      ? { columns: {} }
      : user.ledger_permissions || { columns: {} },

    vouchersPermissions: isAdmin
      ? { can_view: true, columns: {} }
      : user.vouchers_permissions || { can_view: true, columns: {} },

    ordersPermissions: isAdmin
      ? { can_view: true, columns: {} }
      : user.orders_permissions || { can_view: true, columns: {} },

    inventoryPermissions: isAdmin
      ? { columns: {} }
      : user.inventory_permissions || { columns: {} },

    dashboardPermissions: isAdmin
      ? { widgets: {} }
      : user.dashboard_permissions || { widgets: {} },
  },
});

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT id, username, role,
            ledger_permissions,
            vouchers_permissions,
            orders_permissions,
             inventory_permissions,
             dashboard_permissions
     FROM users
     WHERE id = $1`,
    [userId]
  );

  const u = result.rows[0];

  res.json({
    id: u.id,
    username: u.username,
    role: u.role,
    ledgerPermissions: u.ledger_permissions || { columns: {} },
    vouchersPermissions: u.vouchers_permissions || { columns: {} },
    ordersPermissions: u.orders_permissions || { can_view: true, columns: {} },
                inventoryPermissions: u.inventory_permissions || { columns: {} }, // ✅
                dashboardPermissions: user.dashboard_permissions || { widgets: {} },
               dashboardPermissions: u.dashboard_permissions || { widgets: {} },

  });
});


export default router;
