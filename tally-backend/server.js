import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
//import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import requireAuth from "./middleware/requireAuth.js";

//dotenv.config();

// Import DB and routes
import pool from "./db.js";
import companiesRoute from "./routes/companies.js";
import ledgersRoute from "./routes/ledgers.js";
import vouchersRoute from "./routes/voucherEntry.js";
import billsRoute from "./routes/bills.js";
import ageingRoute from "./routes/ageing.js";
import salesOrderRoutes from "./routes/salesOrder.js";
import salesOrderItemRoutes from "./routes/salesOrderItem.js";
import stockItemRoutes from "./routes/stockItem.js";
import stockSummaryRoutes from "./routes/stockSummary.js";
import reportsRoutes from "./routes/reports.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import invoiceItemRoutes from "./routes/invoiceItem.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import ordersRoutes from "./routes/orders.js";
import inventoryRoutes from "./routes/inventory.js";
import dashboardRoutes from "./routes/dashboard.js";

import usersRoute from "./routes/users.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
// Routes
app.use("/company", companiesRoute);

app.use(
  "/ledger",
  (req, res, next) => {
    if (req.path === "/sync") return next();
    requireAuth(req, res, next);
  },
  ledgersRoute
);

app.use(
  "/voucher-entry",
  (req, res, next) => {
    if (req.path === "/sync" || req.path === "/mark-inactive") return next();
    requireAuth(req, res, next);
  },
  vouchersRoute
);



app.use("/orders", requireAuth, ordersRoutes);

app.use("/bill", billsRoute);
app.use("/ageing", ageingRoute);
//app.use("/sales-order", salesOrderRoutes);
app.use(
  "/sales-order",
  (req, res, next) => {
    if (req.path === "/sync") return next();
    requireAuth(req, res, next);
  },
  salesOrderRoutes
);

app.use("/sales-order-item", salesOrderItemRoutes);
//app.use("/stock-item", stockItemRoutes);
app.use(
  "/stock-item",
  (req, res, next) => {
    if (req.path === "/sync") return next();
    requireAuth(req, res, next);
  },
  stockItemRoutes
);

//app.use("/stock-summary", stockSummaryRoutes);
app.use(
  "/stock-summary",
  (req, res, next) => {
    if (req.path === "/sync") return next();
    requireAuth(req, res, next);
  },
  stockSummaryRoutes
);

//app.use("/invoice", invoiceRoutes);
app.use(
  "/invoice",
  (req, res, next) => {
    if (req.path === "/sync" || req.path === "/bulk-sync") return next();
    requireAuth(req, res, next);
  },
  invoiceRoutes
);

//app.use("/invoice-item", invoiceItemRoutes);
app.use(
  "/invoice-item",
  (req, res, next) => {
    if (req.path === "/sync" || req.path === "/bulk-sync") return next();
    requireAuth(req, res, next);
  },
  invoiceItemRoutes
);

app.use("/sync", syncRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/users", usersRoute);
app.use("/uploads", express.static("uploads"));
app.use("/api/users", usersRoute);
app.use("/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
//app.use("/inventory", inventoryRoutes);
//app.use("/stock-summary", stockSummaryRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend working!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// DB test
app.get("/check-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
res.status(500).json({ success: false, error: err.message });
  }
});

// 🔥 Force agent sync (used by UI on company switch)
app.post("/agent/force-sync", (req, res) => {
  global.FORCE_SYNC = true;
  console.log("⚡ Agent force sync requested");
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

