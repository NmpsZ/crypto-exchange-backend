-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'banned');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('fiat', 'crypto');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('bank_transfer', 'promptpay', 'other');

-- CreateEnum
CREATE TYPE "AdvertisementType" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "AdvertisementStatus" AS ENUM ('active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('pending_payment', 'paid', 'completed', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('internal', 'external');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdraw', 'trade_buy', 'trade_sell', 'transfer_in', 'transfer_out', 'fee');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CurrencyType" NOT NULL,
    "decimal_places" INTEGER NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "currency_id" BIGINT NOT NULL,
    "balance" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "crypto_currency_id" BIGINT NOT NULL,
    "fiat_currency_id" BIGINT NOT NULL,
    "payment_method_id" BIGINT NOT NULL,
    "type" "AdvertisementType" NOT NULL,
    "price" DECIMAL(30,10) NOT NULL,
    "total_amount" DECIMAL(30,10) NOT NULL,
    "available_amount" DECIMAL(30,10) NOT NULL,
    "min_limit" DECIMAL(30,10) NOT NULL,
    "max_limit" DECIMAL(30,10) NOT NULL,
    "status" "AdvertisementStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" BIGSERIAL NOT NULL,
    "advertisement_id" BIGINT NOT NULL,
    "buyer_id" BIGINT NOT NULL,
    "seller_id" BIGINT NOT NULL,
    "crypto_amount" DECIMAL(30,10) NOT NULL,
    "fiat_amount" DECIMAL(30,10) NOT NULL,
    "price" DECIMAL(30,10) NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'pending_payment',
    "payment_deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" BIGSERIAL NOT NULL,
    "from_wallet_id" BIGINT NOT NULL,
    "to_wallet_id" BIGINT,
    "to_external_address" TEXT,
    "type" "TransferType" NOT NULL,
    "amount" DECIMAL(30,10) NOT NULL,
    "fee" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "wallet_id" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" BIGINT NOT NULL,
    "amount" DECIMAL(30,10) NOT NULL,
    "balance_after" DECIMAL(30,10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_currency_id_key" ON "wallets"("user_id", "currency_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_crypto_currency_id_fkey" FOREIGN KEY ("crypto_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_fiat_currency_id_fkey" FOREIGN KEY ("fiat_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_advertisement_id_fkey" FOREIGN KEY ("advertisement_id") REFERENCES "advertisements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_wallet_id_fkey" FOREIGN KEY ("from_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_wallet_id_fkey" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
