const prisma = require("./prisma");

class TransferModel {
  static async getFromWallet(transferId) {
    const transfer = await prisma.transfer.findUnique({
      where: { id: BigInt(transferId) },
      include: { fromWallet: true }
    });

    return transfer ? transfer.fromWallet : null;
  }

  static async getToWallet(transferId) {
    const transfer = await prisma.transfer.findUnique({
      where: { id: BigInt(transferId) },
      include: { toWallet: true }
    });

    return transfer ? transfer.toWallet : null;
  }
}

module.exports = TransferModel;
