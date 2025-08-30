const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/profile", authenticateToken, settingsController.getUserProfile);
router.put("/profile", authenticateToken, settingsController.updateUserProfile);
router.post("/logo", authenticateToken, upload.single('logo'), settingsController.updateLogo);
router.get("/logo", settingsController.getLogo);

module.exports = router;