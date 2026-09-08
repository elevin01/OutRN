CREATE TABLE `waitlist` (
	`email` text PRIMARY KEY NOT NULL,
	`neighborhood` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
