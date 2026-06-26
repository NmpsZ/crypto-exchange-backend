const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");

const transferController = {
  createInternalTransfer: asyncHandler(async (req, res) => {
    const { from_wallet_id, to_wallet_id, amount, fee = "0" } = req.body;

    if (!from_wallet_id || !to_wallet_id || !amount) {
      return res.status(400).json({ message: "from_wallet_id, to_wallet_id, and amount are required" });
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUnique({ where: { id: BigInt(from_wallet_id) } });
      const toWallet = await tx.wallet.findUnique({ where: { id: BigInt(to_wallet_id) } });

      if (!fromWallet || fromWallet.user_id !== req.user.id) {
        throw Object.assign(new Error("Source wallet not found"), { statusCode: 404 });
      }
      if (!toWallet || toWallet.currency_id !== fromWallet.currency_id) {
        throw Object.assign(new Error("Destination wallet must exist and use the same currency"), { statusCode: 400 });
      }

      const totalDebit = Number(amount) + Number(fee);
      if (fromWallet.balance.lessThan(totalDebit.toString())) {
        throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
      }

      const updatedFrom = await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: totalDebit.toString() } }
      });
      const updatedTo = await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: amount } }
      });

      const newTransfer = await tx.transfer.create({
        data: {
          from_wallet_id: fromWallet.id,
          to_wallet_id: toWallet.id,
          type: "internal",
          amount,
          fee,
          status: "confirmed"
        }
      });

      await tx.transaction.createMany({
        data: [
          {
            wallet_id: fromWallet.id,
            type: "transfer_out",
            reference_type: "transfers",
            reference_id: newTransfer.id,
            amount: `-${amount}`,
            balance_after: updatedFrom.balance
          },
          {
            wallet_id: toWallet.id,
            type: "transfer_in",
            reference_type: "transfers",
            reference_id: newTransfer.id,
            amount,
            balance_after: updatedTo.balance
          }
        ]
      });

      return newTransfer;
    });

    res.status(201).json({ data: transfer });
  }),

  createExternalTransfer: asyncHandler(async (req, res) => {
    const { from_wallet_id, to_external_address, amount, fee = "0" } = req.body;

    if (!from_wallet_id || !to_external_address || !amount) {
      return res.status(400).json({ message: "from_wallet_id, to_external_address, and amount are required" });
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findUnique({ where: { id: BigInt(from_wallet_id) } });

      if (!fromWallet || fromWallet.user_id !== req.user.id) {
        throw Object.assign(new Error("Source wallet not found"), { statusCode: 404 });
      }

      const totalDebit = Number(amount) + Number(fee);
      if (fromWallet.balance.lessThan(totalDebit.toString())) {
        throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 });
      }

      const updatedFrom = await tx.wallet.update({
        where: { id: fromWallet.id },
        data: {
          balance: { decrement: totalDebit.toString() },
          locked_balance: { increment: totalDebit.toString() }
        }
      });

      const newTransfer = await tx.transfer.create({
        data: {
          from_wallet_id: fromWallet.id,
          to_wallet_id: null,
          to_external_address,
          type: "external",
          amount,
          fee,
          status: "pending"
        }
      });

      await tx.transaction.create({
        data: {
          wallet_id: fromWallet.id,
          type: "withdraw",
          reference_type: "transfers",
          reference_id: newTransfer.id,
          amount: `-${totalDebit}`,
          balance_after: updatedFrom.balance
        }
      });

      return newTransfer;
    });

    res.status(201).json({ data: transfer });
  })
};

module.exports = transferController;
