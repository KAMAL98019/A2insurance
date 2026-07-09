-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_sources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lead_sources_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `parent_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicle_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_number` VARCHAR(50) NOT NULL,
    `owner_name` VARCHAR(100) NOT NULL,
    `cell_number` VARCHAR(20) NOT NULL,
    `cell_number_alt` VARCHAR(20) NULL,
    `category` VARCHAR(50) NOT NULL,
    `policy_expiry_date` DATE NOT NULL,
    `insurance_company` VARCHAR(150) NOT NULL,
    `rc_document` VARCHAR(500) NULL,
    `insurance_document` VARCHAR(500) NULL,
    `aadhaar_document` VARCHAR(500) NULL,
    `pan_document` VARCHAR(500) NULL,
    `photo` VARCHAR(500) NULL,
    `od_document` VARCHAR(500) NULL,
    `tp_document` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_renewals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_record_id` INTEGER NOT NULL,
    `status` ENUM('CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED') NOT NULL DEFAULT 'CONTACTED',
    `notes` TEXT NULL,
    `renewed_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_alert_days` INTEGER NOT NULL DEFAULT 30,
    `second_alert_days` INTEGER NOT NULL DEFAULT 15,
    `final_alert_days` INTEGER NOT NULL DEFAULT 7,
    `enable_whatsapp` BOOLEAN NOT NULL DEFAULT true,
    `enable_email` BOOLEAN NOT NULL DEFAULT false,
    `enable_sms` BOOLEAN NOT NULL DEFAULT false,
    `scheduler_hour` INTEGER NOT NULL DEFAULT 8,
    `language` VARCHAR(10) NOT NULL DEFAULT 'english',
    `contact_name` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `contact_address` VARCHAR(300) NULL,
    `whatsapp_api_key` VARCHAR(500) NULL,
    `whatsapp_api_url` VARCHAR(500) NULL,
    `whatsapp_message_id` VARCHAR(50) NOT NULL DEFAULT '23258',
    `whatsapp_phone_number_id` VARCHAR(100) NOT NULL DEFAULT '1092173950656058',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_record_id` INTEGER NULL,
    `health_insurance_id` INTEGER NULL,
    `mobile_number` VARCHAR(20) NOT NULL,
    `notification_type` ENUM('EXPIRY_30', 'EXPIRY_15', 'EXPIRY_7', 'EXPIRY_TODAY', 'EXPIRED', 'RENEWED', 'MANUAL') NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('SENT', 'FAILED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `response` TEXT NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `policy_number` VARCHAR(100) NOT NULL,
    `insurance_company_name` VARCHAR(150) NOT NULL,
    `policy_holder_name` VARCHAR(100) NOT NULL,
    `mobile_number` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(10) NULL,
    `address` TEXT NULL,
    `policy_type` ENUM('INDIVIDUAL', 'FAMILY_FLOATER', 'SENIOR_CITIZEN', 'GROUP_INSURANCE', 'CRITICAL_ILLNESS') NOT NULL,
    `policy_start_date` DATE NOT NULL,
    `policy_end_date` DATE NOT NULL,
    `renewal_date` DATE NOT NULL,
    `policy_status` ENUM('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `sum_insured` DECIMAL(12, 2) NOT NULL,
    `premium_amount` DECIMAL(10, 2) NOT NULL,
    `payment_mode` ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER') NULL,
    `customer_type` ENUM('NEW', 'RENEWAL') NOT NULL DEFAULT 'NEW',
    `lead_source` VARCHAR(100) NULL,
    `renewal_reminder_status` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    `nominee_name` VARCHAR(100) NULL,
    `nominee_relationship` VARCHAR(50) NULL,
    `nominee_mobile_number` VARCHAR(20) NULL,
    `policy_document` VARCHAR(500) NULL,
    `id_proof` VARCHAR(500) NULL,
    `medical_document` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `health_insurance_policy_number_key`(`policy_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance_family_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `health_insurance_id` INTEGER NOT NULL,
    `member_name` VARCHAR(100) NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(10) NULL,
    `medical_history` TEXT NULL,
    `pre_existing_disease` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance_renewals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `health_insurance_id` INTEGER NOT NULL,
    `status` ENUM('CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED') NOT NULL DEFAULT 'CONTACTED',
    `notes` TEXT NULL,
    `renewed_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fire_insurance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `policy_number` VARCHAR(100) NOT NULL,
    `insurance_company_name` VARCHAR(150) NOT NULL,
    `insured_name` VARCHAR(150) NOT NULL,
    `mobile_number` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gst_number` VARCHAR(50) NULL,
    `business_type` VARCHAR(200) NULL,
    `policy_start_date` DATE NOT NULL,
    `policy_end_date` DATE NOT NULL,
    `renewal_date` DATE NOT NULL,
    `policy_status` ENUM('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `sum_insured` DECIMAL(14, 2) NOT NULL,
    `net_premium` DECIMAL(10, 2) NOT NULL,
    `cgst` DECIMAL(10, 2) NULL,
    `sgst` DECIMAL(10, 2) NULL,
    `stamp_duty` DECIMAL(10, 2) NULL,
    `total_premium` DECIMAL(10, 2) NOT NULL,
    `receipt_number` VARCHAR(100) NULL,
    `receipt_date` DATE NULL,
    `agent_name` VARCHAR(100) NULL,
    `agent_code` VARCHAR(50) NULL,
    `financier_name` VARCHAR(200) NULL,
    `customer_type` ENUM('NEW', 'RENEWAL') NOT NULL DEFAULT 'NEW',
    `lead_source` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `policy_document` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fire_insurance_policy_number_key`(`policy_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fire_insurance_renewals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fire_insurance_id` INTEGER NOT NULL,
    `status` ENUM('CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED') NOT NULL DEFAULT 'CONTACTED',
    `notes` TEXT NULL,
    `renewed_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labour_insurance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `policy_number` VARCHAR(100) NOT NULL,
    `insurance_company_name` VARCHAR(150) NOT NULL,
    `insured_name` VARCHAR(150) NOT NULL,
    `mobile_number` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `business_description` TEXT NULL,
    `gst_number` VARCHAR(50) NULL,
    `intermediary_code` VARCHAR(50) NULL,
    `intermediary_name` VARCHAR(150) NULL,
    `policy_start_date` DATE NOT NULL,
    `policy_end_date` DATE NOT NULL,
    `renewal_date` DATE NOT NULL,
    `policy_status` ENUM('ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `number_of_employees` INTEGER NULL,
    `wages_per_employee` DECIMAL(12, 2) NULL,
    `total_declared_wages` DECIMAL(14, 2) NULL,
    `premium` DECIMAL(10, 2) NOT NULL,
    `cgst` DECIMAL(10, 2) NULL,
    `sgst` DECIMAL(10, 2) NULL,
    `total_premium` DECIMAL(10, 2) NOT NULL,
    `receipt_number` VARCHAR(100) NULL,
    `receipt_date` DATE NULL,
    `labour_policy_type` ENUM('UNNAMED', 'NAMED') NOT NULL DEFAULT 'UNNAMED',
    `customer_type` ENUM('NEW', 'RENEWAL') NOT NULL DEFAULT 'NEW',
    `lead_source` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `policy_document` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `labour_insurance_policy_number_key`(`policy_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `labour_insurance_renewals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `labour_insurance_id` INTEGER NOT NULL,
    `status` ENUM('CONTACTED', 'DOCS_COLLECTED', 'PROCESSING', 'PAYMENT_PENDING', 'RENEWED', 'CANCELLED') NOT NULL DEFAULT 'CONTACTED',
    `notes` TEXT NULL,
    `renewed_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicle_categories` ADD CONSTRAINT `vehicle_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `vehicle_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_renewals` ADD CONSTRAINT `vehicle_renewals_vehicle_record_id_fkey` FOREIGN KEY (`vehicle_record_id`) REFERENCES `vehicle_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_vehicle_record_id_fkey` FOREIGN KEY (`vehicle_record_id`) REFERENCES `vehicle_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_health_insurance_id_fkey` FOREIGN KEY (`health_insurance_id`) REFERENCES `health_insurance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_insurance_family_members` ADD CONSTRAINT `health_insurance_family_members_health_insurance_id_fkey` FOREIGN KEY (`health_insurance_id`) REFERENCES `health_insurance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_insurance_renewals` ADD CONSTRAINT `health_insurance_renewals_health_insurance_id_fkey` FOREIGN KEY (`health_insurance_id`) REFERENCES `health_insurance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fire_insurance_renewals` ADD CONSTRAINT `fire_insurance_renewals_fire_insurance_id_fkey` FOREIGN KEY (`fire_insurance_id`) REFERENCES `fire_insurance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `labour_insurance_renewals` ADD CONSTRAINT `labour_insurance_renewals_labour_insurance_id_fkey` FOREIGN KEY (`labour_insurance_id`) REFERENCES `labour_insurance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

