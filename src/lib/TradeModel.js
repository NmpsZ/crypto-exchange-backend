const prisma = require("./prisma");

class TradeModel {
  static async getBuyer(tradeId) {
    const trade = await prisma.trade.findUnique({
      where: { id: BigInt(tradeId) },
      include: { buyer: true }
    });

    return trade ? trade.buyer : null;
  }

  static async getSeller(tradeId) {
    const trade = await prisma.trade.findUnique({
      where: { id: BigInt(tradeId) },
      include: { seller: true }
    });

    return trade ? trade.seller : null;
  }
}

module.exports = TradeModel;
