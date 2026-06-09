CREATE TABLE `purchase_orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'draft',
	`totalItems` int NOT NULL DEFAULT 0,
	`totalEstimatedValue` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_po_unique` UNIQUE(`shop`,`id`)
);
--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shop` varchar(255) NOT NULL,
	`purchaseOrderId` bigint unsigned NOT NULL,
	`productId` bigint unsigned NOT NULL,
	`variantId` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`suggestedQty` int NOT NULL,
	`approvedQty` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`lineTotal` decimal(10,2) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchase_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchaseOrderId_purchase_orders_id_fk` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_variantId_variants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `variants`(`id`) ON DELETE no action ON UPDATE no action;