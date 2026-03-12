CREATE TABLE `actual_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`supplier` text,
	`description` text,
	`invoice_number` text,
	`invoice_date` text,
	`due_date` text,
	`amount` real NOT NULL,
	`vat_amount` real,
	`payment_status` text DEFAULT 'neuhrazeno' NOT NULL,
	`payment_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `financing` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`equity_amount` real DEFAULT 0 NOT NULL,
	`bank_loan_amount` real DEFAULT 0,
	`bank_loan_rate` real DEFAULT 0,
	`bank_loan_duration_months` integer DEFAULT 0,
	`bank_loan_fee` real DEFAULT 0,
	`investor_loan_amount` real DEFAULT 0,
	`investor_loan_rate` real DEFAULT 0,
	`investor_loan_duration_months` integer DEFAULT 0,
	`notes` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forecast_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`label` text,
	`amount` real NOT NULL,
	`area` real,
	`rate_per_m2` real,
	`notes` text,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `loan_drawdowns` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`loan_type` text NOT NULL,
	`planned_date` text,
	`actual_date` text,
	`planned_amount` real,
	`actual_amount` real,
	`purpose` text,
	`notes` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`planned_date` text,
	`actual_date` text,
	`status` text DEFAULT 'ceka' NOT NULL,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `overhead_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`allocation_percent` real NOT NULL,
	`valid_from` text,
	`valid_to` text,
	`notes` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `overhead_costs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`monthly_amount` real NOT NULL,
	`category` text,
	`is_active` integer DEFAULT true,
	`valid_from` text,
	`valid_to` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`location` text,
	`legal_entity` text,
	`legal_form` text,
	`status` text DEFAULT 'priprava' NOT NULL,
	`start_date` text,
	`end_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revenue_extras` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`label` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `revenue_units` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`unit_type` text NOT NULL,
	`label` text,
	`area` real,
	`price_per_m2` real,
	`total_price` real,
	`planned_sale_month` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`unit_id` text,
	`buyer_name` text,
	`status` text DEFAULT 'rezervace' NOT NULL,
	`reservation_date` text,
	`contract_date` text,
	`payment_date` text,
	`agreed_price` real,
	`deposit_amount` real,
	`deposit_paid` integer DEFAULT false,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `revenue_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tax_config` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`tax_form` text NOT NULL,
	`vat_payer` integer DEFAULT true,
	`vat_rate_revenue` real DEFAULT 21,
	`vat_rate_costs` real DEFAULT 21,
	`fo_other_income` real,
	`cit_rate` real,
	`notes` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
