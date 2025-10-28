CREATE TABLE `fog_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`forecastDate` timestamp NOT NULL,
	`sunriseTime` timestamp NOT NULL,
	`blueHourStart` timestamp NOT NULL,
	`blueHourEnd` timestamp NOT NULL,
	`goldenHourStart` timestamp NOT NULL,
	`goldenHourEnd` timestamp NOT NULL,
	`radiationFogProbability` int NOT NULL,
	`advectionFogProbability` int NOT NULL,
	`overallFogProbability` int NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL,
	`factors` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fog_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`altitude` int NOT NULL DEFAULT 0,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Shanghai',
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`locationId` int NOT NULL,
	`queryDate` timestamp NOT NULL,
	`resultSummary` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `query_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_data_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`timestamp` timestamp NOT NULL,
	`temperature` decimal(5,2) NOT NULL,
	`relativeHumidity` int NOT NULL,
	`dewPoint` decimal(5,2) NOT NULL,
	`windSpeed` decimal(5,2) NOT NULL,
	`weatherCode` int NOT NULL,
	`cloudCover` int NOT NULL,
	`lowCloudCover` int NOT NULL DEFAULT 0,
	`midCloudCover` int NOT NULL DEFAULT 0,
	`highCloudCover` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weather_data_cache_id` PRIMARY KEY(`id`)
);
