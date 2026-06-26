const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const tradeController = require("../controllers/tradeController");

const router = express.Router();

router.patch("/:id/confirm", authMiddleware, tradeController.confirmTrade);

module.exports = router;
