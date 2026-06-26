const prisma = require("./prisma");

class UserModel {
  static getWallets(userId) {
    return prisma.wallet.findMany({
      where: { user_id: BigInt(userId) },
      include: { currency: true }
    });
  }

  static getAdvertisements(userId) {
    return prisma.advertisement.findMany({
      where: { user_id: BigInt(userId) },
      include: { cryptoCurrency: true, fiatCurrency: true, paymentMethod: true }
    });
  }

  static getTradesAsBuyer(userId) {
    return prisma.trade.findMany({
      where: { buyer_id: BigInt(userId) },
      include: { advertisement: true, seller: true }
    });
  }

  static getTradesAsSeller(userId) {
    return prisma.trade.findMany({
      where: { seller_id: BigInt(userId) },
      include: { advertisement: true, buyer: true }
    });
  }
}

module.exports = UserModel;
