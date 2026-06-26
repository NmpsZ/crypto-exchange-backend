const prisma = require("./prisma");

class WalletModel {
  static getTransactions(walletId) {
    return prisma.transaction.findMany({
      where: { wallet_id: BigInt(walletId) },
      orderBy: { created_at: "desc" }
    });
  }

  static async getOwner(walletId) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: BigInt(walletId) },
      include: { user: true }
    });

    return wallet ? wallet.user : null;
  }
}

module.exports = WalletModel;
