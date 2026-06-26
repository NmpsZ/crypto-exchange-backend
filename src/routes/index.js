const express = require("express");
const authRoutes = require("./authRoutes");
const walletRoutes = require("./walletRoutes");
const advertisementRoutes = require("./advertisementRoutes");
const tradeRoutes = require("./tradeRoutes");
const transferRoutes = require("./transferRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/wallets", walletRoutes);
router.use("/advertisements", advertisementRoutes);
router.use("/trades", tradeRoutes);
router.use("/transfers", transferRoutes);

module.exports = router;
