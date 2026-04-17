-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('in_stock', 'in_transit', 'reserved', 'sold', 'hidden');

-- CreateEnum
CREATE TYPE "PurchasePlan" AS ENUM ('viewing', 'three_months', 'ready_now');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('user', 'manager');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('match_found', 'hot_filter', 'hot_match', 'contact_clicked', 'reengagement');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('user_registered', 'filter_created', 'filter_updated', 'vehicle_opened', 'contact_clicked', 'call_clicked', 'favorite_added', 'favorite_removed', 'catalog_opened', 'news_opened', 'notification_sent_user', 'notification_sent_manager', 'notification_failed_user', 'notification_failed_manager', 'notification_skipped_rate_limit', 'vehicle_created', 'vehicle_updated', 'vehicle_status_changed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "bodyTypes" JSONB,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "budgetMax" INTEGER NOT NULL,
    "budgetMin" INTEGER,
    "engineTypes" JSONB,
    "engineVolumeFrom" DOUBLE PRECISION,
    "engineVolumeTo" DOUBLE PRECISION,
    "drivetrain" JSONB,
    "transmission" JSONB,
    "exteriorColors" JSONB,
    "interiorColors" JSONB,
    "mileageMax" INTEGER,
    "onlyNew" BOOLEAN,
    "purchasePlan" "PurchasePlan" NOT NULL DEFAULT 'viewing',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "generation" TEXT,
    "year" INTEGER NOT NULL,
    "bodyType" TEXT NOT NULL,
    "engineType" TEXT NOT NULL,
    "engineVolume" DOUBLE PRECISION,
    "powerHp" INTEGER,
    "transmission" TEXT NOT NULL,
    "drivetrain" TEXT NOT NULL,
    "mileage" INTEGER,
    "exteriorColor" TEXT,
    "interiorColor" TEXT,
    "trimOptions" JSONB,
    "priceKeyTurnKZT" INTEGER NOT NULL,
    "priceChina" INTEGER,
    "deliveryEtaWeeks" INTEGER,
    "paymentOptions" JSONB,
    "status" "VehicleStatus" NOT NULL DEFAULT 'in_stock',
    "media" JSONB,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "userId" TEXT,
    "filterId" TEXT,
    "vehicleId" TEXT,
    "text" TEXT NOT NULL,
    "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "userId" TEXT,
    "filterId" TEXT,
    "vehicleId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "coverImage" TEXT,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL,
    "story" TEXT NOT NULL DEFAULT '',
    "numbers" JSONB,
    "geography" JSONB,
    "partners" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Filter_userId_idx" ON "Filter"("userId");

-- CreateIndex
CREATE INDEX "Filter_brand_model_idx" ON "Filter"("brand", "model");

-- CreateIndex
CREATE INDEX "Filter_budgetMax_idx" ON "Filter"("budgetMax");

-- CreateIndex
CREATE INDEX "Filter_purchasePlan_idx" ON "Filter"("purchasePlan");

-- CreateIndex
CREATE INDEX "Vehicle_status_updatedAt_idx" ON "Vehicle"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Vehicle_brand_model_year_idx" ON "Vehicle"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "Vehicle_priceKeyTurnKZT_idx" ON "Vehicle"("priceKeyTurnKZT");

-- CreateIndex
CREATE INDEX "Vehicle_bodyType_idx" ON "Vehicle"("bodyType");

-- CreateIndex
CREATE INDEX "Vehicle_engineType_idx" ON "Vehicle"("engineType");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_vehicleId_key" ON "Favorite"("userId", "vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupKey_key" ON "Notification"("dedupKey");

-- CreateIndex
CREATE INDEX "Notification_channel_type_createdAt_idx" ON "Notification"("channel", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_type_createdAt_idx" ON "Event"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Event_userId_createdAt_idx" ON "Event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_vehicleId_createdAt_idx" ON "Event"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "News_status_date_idx" ON "News"("status", "date");

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

