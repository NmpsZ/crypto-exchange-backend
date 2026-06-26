const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const advertisementController = require("../controllers/advertisementController");
const tradeController = require("../controllers/tradeController");

const router = express.Router();

router.get("/", advertisementController.listAdvertisements);
router.post("/", authMiddleware, advertisementController.createAdvertisement);
router.post("/:id/trade", authMiddleware, tradeController.createTrade);

module.exports = router;
