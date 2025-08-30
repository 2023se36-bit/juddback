
const express = require("express");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const controller = require("../controllers/courtController");

const router = express.Router();
//all courts
router.get("/all", authenticateToken,requireAdmin ,controller.getAllCourts);
// Circuit Courts
router.post("/circuit", authenticateToken, requireAdmin, controller.createCircuitCourt);
router.get("/circuit", authenticateToken, controller.getCircuitCourts);
router.delete("/circuit/:id", authenticateToken, requireAdmin, controller.deleteCircuitCourt);

// Magisterial Courts
router.post("/magisterial", authenticateToken, requireAdmin, controller.createMagisterialCourt);
router.get("/magisterial", authenticateToken, controller.getMagisterialCourts);
router.get("/circuit/:circuitId/magisterial", authenticateToken, controller.getMagisterialCourtsByCircuit);
router.put("/magisterial/:id", authenticateToken, requireAdmin, controller.updateMagisterialCourt);
router.delete("/magisterial/:id", authenticateToken, requireAdmin, controller.deleteMagisterialCourt);

// Departments
router.post("/department", authenticateToken, requireAdmin, controller.createDepartment);
router.get("/department", authenticateToken, controller.getDepartments);
router.put("/department/:id", authenticateToken, requireAdmin, controller.updateDepartment);
router.delete("/department/:id", authenticateToken, requireAdmin, controller.deleteDepartment);

// Generic court endpoints
router.get("/:id", authenticateToken, controller.getCourtById);
router.put("/:id", authenticateToken, requireAdmin, controller.updateCourt);

module.exports = router;
