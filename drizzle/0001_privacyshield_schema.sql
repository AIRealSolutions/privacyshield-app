CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(32) NOT NULL,
	`maxMembers` int NOT NULL DEFAULT 1,
	`priceMonthly` float NOT NULL,
	`priceAnnual` float NOT NULL,
	`stripePriceIdMonthly` varchar(128),
	`stripePriceIdAnnual` varchar(128),
	`features` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`status` enum('active','trialing','past_due','cancelled','incomplete') NOT NULL DEFAULT 'incomplete',
	`billingCycle` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `identity_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(256) NOT NULL,
	`aliases` json,
	`addresses` json,
	`phoneNumbers` json,
	`emailAddresses` json,
	`dateOfBirth` varchar(16),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `identity_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_brokers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`domain` varchar(256) NOT NULL,
	`searchUrl` text,
	`optOutUrl` text,
	`removalMethod` enum('form','email','phone','account','manual') NOT NULL DEFAULT 'form',
	`removalEmail` varchar(320),
	`priorityTier` enum('critical','high','standard') NOT NULL DEFAULT 'standard',
	`difficultyRating` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`requiresId` boolean NOT NULL DEFAULT false,
	`requiresPhone` boolean NOT NULL DEFAULT false,
	`requiresPayment` boolean NOT NULL DEFAULT false,
	`dataTypes` json,
	`parentCompany` varchar(128),
	`subsidiaries` json,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_brokers_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_brokers_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `scan_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`brokerId` int NOT NULL,
	`foundUrl` text,
	`dataTypesFound` json,
	`isPresent` boolean NOT NULL DEFAULT true,
	`scanType` enum('initial','weekly','manual') NOT NULL DEFAULT 'initial',
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `removal_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`brokerId` int NOT NULL,
	`scanResultId` int,
	`status` enum('Pending','Submitted','Confirmed','Re-appeared') NOT NULL DEFAULT 'Pending',
	`submissionMethod` enum('automated','manual','email') NOT NULL DEFAULT 'automated',
	`submittedAt` timestamp,
	`confirmedAt` timestamp,
	`reappearedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `removal_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breach_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`email` varchar(320) NOT NULL,
	`breachName` varchar(256) NOT NULL,
	`breachDomain` varchar(256),
	`breachDate` varchar(16),
	`dataClasses` json,
	`description` text,
	`isVerified` boolean NOT NULL DEFAULT true,
	`isSensitive` boolean NOT NULL DEFAULT false,
	`isFabricated` boolean NOT NULL DEFAULT false,
	`isRead` boolean NOT NULL DEFAULT false,
	`source` enum('hibp','darkweb','manual') NOT NULL DEFAULT 'hibp',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `breach_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`jobType` enum('weekly_scan','breach_check','manual') NOT NULL DEFAULT 'weekly_scan',
	`status` enum('scheduled','running','completed','failed') NOT NULL DEFAULT 'scheduled',
	`sitesScanned` int NOT NULL DEFAULT 0,
	`newFindings` int NOT NULL DEFAULT 0,
	`reappearances` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitoring_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deindex_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`engine` enum('google','bing') NOT NULL,
	`targetUrl` text NOT NULL,
	`reason` text,
	`status` enum('Pending','Submitted','Confirmed','Rejected') NOT NULL DEFAULT 'Pending',
	`submittedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deindex_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_assistance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int,
	`brokerId` int,
	`requestType` enum('opt_out_email','gdpr_ccpa_letter','manual_guidance') NOT NULL,
	`generatedContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_assistance_requests_id` PRIMARY KEY(`id`)
);
