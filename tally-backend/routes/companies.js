import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

/* -----------------------
   PUBLIC (Agent access)
------------------------ */

// Get active company
// Get active company (SAFE for fresh DB)
router.get("/active", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT company_guid FROM active_company WHERE id = 1"
    );

    return res.json({
      success: true,
      company_guid: result.rows[0]?.company_guid || null,
    });
  } catch (err) {
    // IMPORTANT: never crash agent on fresh DB
    console.error("❌ /company/active error:", err.message);

    return res.json({
      success: true,
      company_guid: null,
    });
  }
});


// Create / upsert company (AGENT)
router.post("/create", async (req, res) => {
  const { company_guid, name } = req.body;

  const result = await pool.query(
    `INSERT INTO companies (company_guid, name)
     VALUES ($1, $2)
     ON CONFLICT (company_guid)
     DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [company_guid, name]
  );

  res.json({ success: true, data: result.rows[0] });
});

/* -----------------------
   AUTH REQUIRED BELOW
------------------------ */
router.use(requireAuth);

// List companies (UI)
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM companies");
  res.json({ success: true, data: result.rows });
});

// Set active company (ADMIN only)
// Set Active Company
router.post("/set-active", async (req, res) => {
  const { company_guid } = req.body;

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only ADMIN can switch company",
    });
  }

  await pool.query(
    `
    INSERT INTO active_company (id, company_guid)
    VALUES (1, $1)
    ON CONFLICT (id)
    DO UPDATE SET
      company_guid = EXCLUDED.company_guid,
      updated_at = NOW()
    `,
    [company_guid]
  );

  // ⚡ TRIGGER INSTANT SYNC
  global.FORCE_SYNC = true;

  res.json({
    success: true,
    message: "Active company updated & sync triggered",
    company_guid,
  });
});


export default router;
