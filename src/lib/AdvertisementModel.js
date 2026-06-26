const prisma = require("./prisma");

class AdvertisementModel {
  static getTrades(adId) {
    return prisma.trade.findMany({
      where: { advertisement_id: BigInt(adId) },
      include: { buyer: true, seller: true }
    });
  }

  static async getCryptoCurrency(adId) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: BigInt(adId) },
      include: { cryptoCurrency: true }
    });

    return advertisement ? advertisement.cryptoCurrency : null;
  }

  static async getFiatCurrency(adId) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: BigInt(adId) },
      include: { fiatCurrency: true }
    });

    return advertisement ? advertisement.fiatCurrency : null;
  }
}

module.exports = AdvertisementModel;
