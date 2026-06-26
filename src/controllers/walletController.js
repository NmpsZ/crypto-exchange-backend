const prisma = require("../lib/prisma");
const UserModel = require("../lib/UserModel");
const WalletModel = require("../lib/WalletModel");
const asyncHandler = require("../utils/asyncHandler");

const walletController = {
  listMyWallets: asyncHandler(async (req, res) => {
    const wallets = await UserModel.getWallets(req.user.id);
    res.json({ data: wallets });
  }),

  getWalletTransactions: asyncHandler(async (req, res) => {
    const walletId = BigInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });

    if (!wallet || wallet.user_id !== req.user.id) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await WalletModel.getTransactions(walletId);
    res.json({ data: transactions });
  })
};

module.exports = walletController;
