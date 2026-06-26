const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { signToken, publicUser } = require("../utils/auth");

const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name || !phone) {
      return res.status(400).json({ message: "email, password, full_name, and phone are required" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, password_hash, full_name, phone }
      });

      const currencies = await tx.currency.findMany();

      for (const currency of currencies) {
        await tx.wallet.create({
          data: {
            user_id: newUser.id,
            currency_id: currency.id,
            balance: currency.type === "crypto" ? "20" : "500000",
            locked_balance: 0,
            address: currency.type === "crypto"
              ? `${currency.code.toLowerCase()}_${newUser.id.toString()}_wallet`
              : null
          }
        });
      }

      // สร้างช่องทางรับเงินเริ่มต้นให้อัตโนมัติ เพื่อให้สามารถตั้งประกาศขายได้เลย
      await tx.paymentMethod.create({
        data: {
          user_id: newUser.id,
          type: "promptpay",
          account_name: newUser.full_name,
          account_number: phone || "0000000000"
        }
      });

      return newUser;
    });

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches || user.status !== "active") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  })
};

module.exports = authController;
