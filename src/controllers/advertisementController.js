const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");

const advertisementController = {
  listAdvertisements: asyncHandler(async (req, res) => {
    const { crypto_currency_id, fiat_currency_id, type } = req.query;
    const where = { status: "active" };

    if (crypto_currency_id) where.crypto_currency_id = BigInt(crypto_currency_id);
    if (fiat_currency_id) where.fiat_currency_id = BigInt(fiat_currency_id);
    if (type) where.type = type;

    const advertisements = await prisma.advertisement.findMany({
      where,
      include: { user: true, cryptoCurrency: true, fiatCurrency: true, paymentMethod: true },
      orderBy: { created_at: "desc" }
    });

    res.json({ data: advertisements });
  }),

  createAdvertisement: asyncHandler(async (req, res) => {
    const {
      crypto_currency_id,
      fiat_currency_id,
      payment_method_id,
      type,
      price,
      total_amount,
      min_limit,
      max_limit
    } = req.body;

    if (!crypto_currency_id || !fiat_currency_id || !payment_method_id || !type || !price || !total_amount || !min_limit || !max_limit) {
      return res.status(400).json({ message: "Missing required advertisement fields" });
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: BigInt(payment_method_id), user_id: req.user.id }
    });

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method not found for current user" });
    }

    const advertisement = await prisma.$transaction(async (tx) => {
      if (type === "sell") {
        const wallet = await tx.wallet.findFirst({
          where: { user_id: req.user.id, currency_id: BigInt(crypto_currency_id) }
        });

        if (!wallet || wallet.balance.lessThan(total_amount)) {
          throw Object.assign(new Error("Insufficient crypto balance"), { statusCode: 400 });
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: total_amount },
            locked_balance: { increment: total_amount }
          }
        });
      }

      return tx.advertisement.create({
        data: {
          user_id: req.user.id,
          crypto_currency_id: BigInt(crypto_currency_id),
          fiat_currency_id: BigInt(fiat_currency_id),
          payment_method_id: BigInt(payment_method_id),
          type,
          price,
          total_amount,
          available_amount: total_amount,
          min_limit,
          max_limit
        },
        include: { cryptoCurrency: true, fiatCurrency: true, paymentMethod: true }
      });
    });

    res.status(201).json({ data: advertisement });
  })
};

module.exports = advertisementController;
