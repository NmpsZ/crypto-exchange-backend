const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.user.deleteMany();

  const currencies = await Promise.all([
    prisma.currency.create({ data: { code: "BTC", name: "Bitcoin", type: "crypto", decimal_places: 8 } }),
    prisma.currency.create({ data: { code: "ETH", name: "Ethereum", type: "crypto", decimal_places: 8 } }),
    prisma.currency.create({ data: { code: "XRP", name: "Ripple", type: "crypto", decimal_places: 6 } }),
    prisma.currency.create({ data: { code: "DOGE", name: "Dogecoin", type: "crypto", decimal_places: 8 } }),
    prisma.currency.create({ data: { code: "THB", name: "Thai Baht", type: "fiat", decimal_places: 2 } }),
    prisma.currency.create({ data: { code: "USD", name: "US Dollar", type: "fiat", decimal_places: 2 } })
  ]);

  const byCode = Object.fromEntries(currencies.map((currency) => [currency.code, currency]));
  const password_hash = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.create({ data: { email: "alice@example.com", password_hash, full_name: "Alice Satoshi", phone: "0800000001" } }),
    prisma.user.create({ data: { email: "bob@example.com", password_hash, full_name: "Bob Nakamoto", phone: "0800000002" } }),
    prisma.user.create({ data: { email: "carol@example.com", password_hash, full_name: "Carol Buterin", phone: "0800000003" } }),
    prisma.user.create({ data: { email: "dan@example.com", password_hash, full_name: "Dan Finney", phone: "0800000004" } })
  ]);

  for (const user of users) {
    for (const currency of currencies) {
      const isCrypto = currency.type === "crypto";
      await prisma.wallet.create({
        data: {
          user_id: user.id,
          currency_id: currency.id,
          balance: isCrypto ? "20.00000000" : "500000.00",
          locked_balance: "0",
          address: isCrypto ? `${currency.code.toLowerCase()}_${user.id.toString()}_wallet` : null
        }
      });
    }
  }

  const paymentMethods = await Promise.all(
    users.map((user, index) =>
      prisma.paymentMethod.create({
        data: {
          user_id: user.id,
          type: index % 2 === 0 ? "bank_transfer" : "promptpay",
          account_name: user.full_name,
          account_number: `000-0-${index + 1}2345-6`,
          bank_name: index % 2 === 0 ? "Demo Bank" : null
        }
      })
    )
  );

  const advertisements = await Promise.all([
    prisma.advertisement.create({
      data: {
        user_id: users[0].id,
        crypto_currency_id: byCode.BTC.id,
        fiat_currency_id: byCode.THB.id,
        payment_method_id: paymentMethods[0].id,
        type: "sell",
        price: "2450000",
        total_amount: "1.5",
        available_amount: "1.0",
        min_limit: "1000",
        max_limit: "250000"
      }
    }),
    prisma.advertisement.create({
      data: {
        user_id: users[1].id,
        crypto_currency_id: byCode.ETH.id,
        fiat_currency_id: byCode.THB.id,
        payment_method_id: paymentMethods[1].id,
        type: "sell",
        price: "135000",
        total_amount: "10",
        available_amount: "10",
        min_limit: "500",
        max_limit: "100000"
      }
    }),
    prisma.advertisement.create({
      data: {
        user_id: users[2].id,
        crypto_currency_id: byCode.XRP.id,
        fiat_currency_id: byCode.THB.id,
        payment_method_id: paymentMethods[2].id,
        type: "buy",
        price: "21.5",
        total_amount: "20000",
        available_amount: "18000",
        min_limit: "300",
        max_limit: "50000"
      }
    }),
    prisma.advertisement.create({
      data: {
        user_id: users[3].id,
        crypto_currency_id: byCode.DOGE.id,
        fiat_currency_id: byCode.USD.id,
        payment_method_id: paymentMethods[3].id,
        type: "buy",
        price: "0.14",
        total_amount: "50000",
        available_amount: "50000",
        min_limit: "10",
        max_limit: "5000"
      }
    })
  ]);

  const trades = await Promise.all([
    prisma.trade.create({
      data: {
        advertisement_id: advertisements[0].id,
        buyer_id: users[2].id,
        seller_id: users[0].id,
        crypto_amount: "0.5",
        fiat_amount: "1225000",
        price: "2450000",
        status: "completed",
        payment_deadline: new Date(Date.now() + 15 * 60 * 1000),
        completed_at: new Date()
      }
    }),
    prisma.trade.create({
      data: {
        advertisement_id: advertisements[2].id,
        buyer_id: users[2].id,
        seller_id: users[1].id,
        crypto_amount: "2000",
        fiat_amount: "43000",
        price: "21.5",
        status: "pending_payment",
        payment_deadline: new Date(Date.now() + 15 * 60 * 1000)
      }
    })
  ]);

  const aliceBtcWallet = await prisma.wallet.findFirst({ where: { user_id: users[0].id, currency_id: byCode.BTC.id } });
  const bobBtcWallet = await prisma.wallet.findFirst({ where: { user_id: users[1].id, currency_id: byCode.BTC.id } });
  const carolEthWallet = await prisma.wallet.findFirst({ where: { user_id: users[2].id, currency_id: byCode.ETH.id } });

  await Promise.all([
    prisma.transfer.create({
      data: {
        from_wallet_id: aliceBtcWallet.id,
        to_wallet_id: bobBtcWallet.id,
        type: "internal",
        amount: "0.25",
        fee: "0",
        status: "confirmed"
      }
    }),
    prisma.transfer.create({
      data: {
        from_wallet_id: carolEthWallet.id,
        to_wallet_id: null,
        to_external_address: "0x1111111111111111111111111111111111111111",
        type: "external",
        amount: "1.2",
        fee: "0.01",
        status: "pending"
      }
    })
  ]);

  const carolBtcWallet = await prisma.wallet.findFirst({ where: { user_id: users[2].id, currency_id: byCode.BTC.id } });
  await prisma.transaction.create({
    data: {
      wallet_id: carolBtcWallet.id,
      type: "trade_buy",
      reference_type: "trades",
      reference_id: trades[0].id,
      amount: "0.5",
      balance_after: carolBtcWallet.balance
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
