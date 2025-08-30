const express = require("express");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const controller = require("../controllers/staffController");

const router = express.Router();
router.get("/statistics", controller.getStaffStatistics);

// Staff CRUD
router.get("/on-leave", authenticateToken, controller.getOnLeaveStaff);
router.get("/dismissed", authenticateToken, controller.getDismissedStaff);
router.get("/retired", authenticateToken, controller.getRetiredStaff);
router.get("/active", authenticateToken, controller.getActiveStaff);
router.get("/all", authenticateToken, controller.getAllStaff);
router.get("/:id", authenticateToken, controller.getStaffById);
router.post("/add", authenticateToken, requireAdmin, controller.createStaff);
router.put("/:id", authenticateToken, requireAdmin, controller.updateStaff);
router.delete("/:id", authenticateToken, requireAdmin, controller.deleteStaff);

// Staff statistics

// Recycle bin
router.get("/recycle-bin/all", authenticateToken, requireAdmin, controller.getRecycleBin);
router.post("/recycle-bin/restore/:id", authenticateToken, requireAdmin, controller.restoreFromRecycleBin);
router.delete("/recycle-bin/permanent/:id", authenticateToken, requireAdmin, controller.permanentlyDelete);

module.exports = router;
