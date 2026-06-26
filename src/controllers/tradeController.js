const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const tradeController = {
  createTrade: asyncHandler(async (req, res) => {
    const advertisementId = BigInt(req.params.id);
    const { crypto_amount } = req.body;

    if (!crypto_amount) {
      return res.status(400).json({ message: "crypto_amount is required" });
    }

    const trade = await prisma.$transaction(async (tx) => {
      const advertisement = await tx.advertisement.findUnique({ where: { id: advertisementId } });

      if (!advertisement || advertisement.status !== "active") {
        throw Object.assign(new Error("Advertisement not found or inactive"), { statusCode: 404 });
      }

      if (advertisement.user_id === req.user.id) {
        throw Object.assign(new Error("Cannot trade with your own advertisement"), { statusCode: 400 });
      }

      if (advertisement.available_amount.lessThan(crypto_amount)) {
        throw Object.assign(new Error("Advertisement does not have enough available amount"), { statusCode: 400 });
      }

      const buyer_id = advertisement.type === "sell" ? req.user.id : advertisement.user_id;
      const seller_id = advertisement.type === "sell" ? advertisement.user_id : req.user.id;
      const fiat_amount = advertisement.price.mul(crypto_amount);

      if (advertisement.type === "buy") {
        const sellerWallet = await tx.wallet.findFirst({
          where: {
            user_id: req.user.id,
            currency_id: advertisement.crypto_currency_id
          }
        });

        if (!sellerWallet || sellerWallet.balance.lessThan(crypto_amount)) {
          throw Object.assign(new Error("Insufficient crypto balance"), { statusCode: 400 });
        }

        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: {
            balance: { decrement: crypto_amount },
            locked_balance: { increment: crypto_amount }
          }
        });
      }

      await tx.advertisement.update({
        where: { id: advertisement.id },
        data: { available_amount: { decrement: crypto_amount } }
      });

      return tx.trade.create({
        data: {
          advertisement_id: advertisement.id,
          buyer_id,
          seller_id,
          crypto_amount,
          fiat_amount,
          price: advertisement.price,
          status: "pending_payment",
          payment_deadline: addMinutes(new Date(), 15)
        },
        include: { advertisement: true, buyer: true, seller: true }
      });
    });

    res.status(201).json({ data: trade });
  }),

  confirmTrade: asyncHandler(async (req, res) => {
    const tradeId = BigInt(req.params.id);

    const completedTrade = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUnique({
        where: { id: tradeId },
        include: { advertisement: true }
      });

      if (!trade || trade.status === "completed") {
        throw Object.assign(new Error("Trade not found or already completed"), { statusCode: 404 });
      }

      if (trade.seller_id !== req.user.id && trade.buyer_id !== req.user.id) {
        throw Object.assign(new Error("You are not part of this trade"), { statusCode: 403 });
      }

      const sellerWallet = await tx.wallet.findFirst({
        where: { user_id: trade.seller_id, currency_id: trade.advertisement.crypto_currency_id }
      });
      const buyerWallet = await tx.wallet.findFirst({
        where: { user_id: trade.buyer_id, currency_id: trade.advertisement.crypto_currency_id }
      });

      if (!sellerWallet || !buyerWallet) {
        throw Object.assign(new Error("Buyer or seller wallet not found"), { statusCode: 400 });
      }

      if (sellerWallet.locked_balance.lessThan(trade.crypto_amount)) {
        throw Object.assign(new Error("Seller locked balance is insufficient"), { statusCode: 400 });
      }

      const updatedSellerWallet = await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { locked_balance: { decrement: trade.crypto_amount } }
      });
      const updatedBuyerWallet = await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { balance: { increment: trade.crypto_amount } }
      });

      await tx.transaction.createMany({
        data: [
          {
            wallet_id: sellerWallet.id,
            type: "trade_sell",
            reference_type: "trades",
            reference_id: trade.id,
            amount: trade.crypto_amount.negated(),
            balance_after: updatedSellerWallet.balance
          },
          {
            wallet_id: buyerWallet.id,
            type: "trade_buy",
            reference_type: "trades",
            reference_id: trade.id,
            amount: trade.crypto_amount,
            balance_after: updatedBuyerWallet.balance
          }
        ]
      });

      return tx.trade.update({
        where: { id: trade.id },
        data: { status: "completed", completed_at: new Date() },
        include: { advertisement: true, buyer: true, seller: true }
      });
    });

    res.json({ data: completedTrade });
  })
};

module.exports = tradeController;
