CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`shop` text NOT NULL,
	`state` text NOT NULL,
	`isOnline` boolean NOT NULL DEFAULT false,
	`scope` text,
	`expires` timestamp,
	`accessToken` text NOT NULL,
	`userId` bigint,
	`firstName` text,
	`lastName` text,
	`email` text,
	`accountOwner` boolean,
	`locale` text,
	`collaborator` boolean,
	`emailVerified` boolean,
	`refreshToken` text,
	`refreshTokenExpires` timestamp,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_configurations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`safetyStockDays` int,
	`deliveryLeadTimeDays` int,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_shop` UNIQUE(`shop`)
);
--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` text NOT NULL,
	`action` text NOT NULL,
	`entityType` text,
	`entityId` int,
	`message` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`shopifyProductId` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_shop_shopifyProductId` UNIQUE(`shop`,`shopifyProductId`)
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`productId` bigint unsigned NOT NULL,
	`shopifyInventoryItemId` varchar(255) NOT NULL,
	`shopifyVariantId` varchar(255) NOT NULL,
	`title` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`inventoryQuantity` int NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_shop_shopifyVariantId` UNIQUE(`shop`,`shopifyVariantId`)
);
--> statement-breakpoint
CREATE TABLE `sales_snapshots` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`variantId` bigint unsigned NOT NULL,
	`date` date NOT NULL,
	`quantitySold` int NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_shop_variantId_date` UNIQUE(`shop`,`variantId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `restock_recommendations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`variantId` bigint unsigned NOT NULL,
	`currentInventory` int NOT NULL,
	`avgDailySales` decimal(10,2) NOT NULL,
	`daysUntilStockout` int NOT NULL,
	`deliveryLeadTimeDays` int NOT NULL,
	`safetyStockDays` int NOT NULL,
	`suggestedQty` int NOT NULL,
	`approvedQty` int,
	`status` varchar(255) NOT NULL DEFAULT 'pending',
	`purchaseOrderId` varchar(191),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restock_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `variants` ADD CONSTRAINT `variants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales_snapshots` ADD CONSTRAINT `sales_snapshots_variantId_variants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `variants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `restock_recommendations` ADD CONSTRAINT `restock_recommendations_variantId_variants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `variants`(`id`) ON DELETE no action ON UPDATE no action;