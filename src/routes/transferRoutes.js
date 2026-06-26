const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const transferController = require("../controllers/transferController");

const router = express.Router();

router.post("/internal", authMiddleware, transferController.createInternalTransfer);
router.post("/external", authMiddleware, transferController.createExternalTransfer);

module.exports = router;
