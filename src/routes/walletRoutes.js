const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const walletController = require("../controllers/walletController");

const router = express.Router();

router.get("/", authMiddleware, walletController.listMyWallets);
router.get("/:id/transactions", authMiddleware, walletController.getWalletTransactions);

module.exports = router;
