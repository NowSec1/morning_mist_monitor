CREATE TABLE `notification_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`locationId` int NOT NULL,
	`type` enum('dingtalk','pushdeer') NOT NULL,
	`channelId` varchar(500) NOT NULL,
	`name` varchar(255) NOT NULL,
	`threshold` int NOT NULL DEFAULT 80,
	`enabled` int NOT NULL DEFAULT 1,
	`frequency` enum('daily','always') NOT NULL DEFAULT 'daily',
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`locationId` int NOT NULL,
	`configId` int NOT NULL,
	`type` enum('dingtalk','pushdeer') NOT NULL,
	`fogProbability` int NOT NULL,
	`message` text NOT NULL,
	`status` enum('success','failed') NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_history_id` PRIMARY KEY(`id`)
);
