import express from "express";
import pool from "../db.js";
import crypto from "crypto";
import { computeDiff } from "../utils/diffPayload.js";

const router = express.Router();

router.post("/event", async (req, res) => {
  const {
    entity_type,
    entity_guid,
    company_guid,
    operation,
    source,
    payload,
  } = req.body;

  try {
    /* 1️⃣ Hash payload */
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payload || {}))
      .digest("hex");

    /* 2️⃣ Fetch previous payload from queue */
    const lastLogResult = await pool.query(
      `
      SELECT q.payload, l.payload_hash
      FROM sync_logs l
      JOIN sync_queue q ON q.id = l.queue_id
      WHERE l.entity_type = $1
        AND l.entity_guid = $2
        AND l.company_guid = $3
      ORDER BY l.created_at DESC
      LIMIT 1
      `,
      [entity_type, entity_guid, company_guid]
    );

    let status = "INSERTED";
    let diff = null;

    if (lastLogResult.rows.length > 0) {
      const lastPayload = lastLogResult.rows[0].payload || {};
      const lastHash = lastLogResult.rows[0].payload_hash;

      if (lastHash === payloadHash) {
        status = "NO_CHANGE";
      } else {
        status = "UPDATED";
        diff = computeDiff(lastPayload, payload || {});
      }
    }

    /* 3️⃣ Insert into sync_queue */
    const queueResult = await pool.query(
      `
      INSERT INTO sync_queue
      (
        entity_type,
        entity_guid,
        company_guid,
        operation,
        source,
        payload,
        payload_hash,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
      `,
      [
        entity_type,
        entity_guid,
        company_guid,
        operation,
        source,
        payload,
        payloadHash,
        status,
      ]
    );

    const queueId = queueResult.rows[0].id;

    /* 4️⃣ Insert audit log (NO payload here) */
    await pool.query(
      `
      INSERT INTO sync_logs
      (
        queue_id,
        entity_type,
        entity_guid,
        company_guid,
        action,
        status,
        payload_hash,
        diff,
        message
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        queueId,
        entity_type,
        entity_guid,
        company_guid,
        operation,
        status,
        payloadHash,
        diff,
        `Event ${status} from ${source}`,
      ]
    );

    return res.json({
      success: true,
      queue_id: queueId,
      status,
      diff,
    });
  } catch (err) {
    console.error("Sync Event Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ⚡ Trigger immediate sync
router.post("/trigger", async (req, res) => {
  global.FORCE_SYNC = true;

  return res.json({
    success: true,
    message: "Sync triggered",
  });
});

export default router;
