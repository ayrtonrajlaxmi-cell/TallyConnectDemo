module.exports = function requireInventoryPermission(req, res, next) {
  try {
    const user = req.user;

    // Admin bypass
    if (user.role === "ADMIN") {
      return next();
    }

    // No permissions object
    if (!user.inventoryPermissions) {
      return res.status(403).json({ message: "Inventory access denied" });
    }

    // Explicit deny
    if (user.inventoryPermissions.can_view === false) {
      return res.status(403).json({ message: "Inventory access denied" });
    }

    next();
  } catch (err) {
    console.error("Inventory permission error:", err);
    res.status(500).json({ message: "Permission check failed" });
  }
};
