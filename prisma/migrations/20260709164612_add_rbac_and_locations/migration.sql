-- =========================================================================
-- RBAC + Location Access Control migration
-- Safe, additive-first, backfills existing data before any destructive step.
-- =========================================================================

-- ── 1. Add new nullable columns to users (zero risk — no data touched) ──
ALTER TABLE `users`
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NULL,
    ADD COLUMN `created_by_id` INTEGER NULL,
    ADD COLUMN `last_login_at` DATETIME(3) NULL,
    ADD COLUMN `primary_location_id` INTEGER NULL,
    ADD COLUMN `super_admin_id` INTEGER NULL,
    ADD COLUMN `role_new` ENUM('MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN_USER') NULL;

-- ── 2. Backfill status from legacy is_active (preserve existing signal) ──
UPDATE `users` SET `status` = IF(`is_active` = 1, 'ACTIVE', 'INACTIVE');
ALTER TABLE `users` MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE';

-- ── 3. Backfill new role from legacy role (ADMIN -> MASTER_ADMIN, USER -> ADMIN_USER) ──
UPDATE `users` SET `role_new` = CASE
    WHEN `role` = 'ADMIN' THEN 'MASTER_ADMIN'
    WHEN `role` = 'USER'  THEN 'ADMIN_USER'
    ELSE 'ADMIN_USER'
END;
ALTER TABLE `users` DROP COLUMN `role`;
ALTER TABLE `users` CHANGE `role_new` `role` ENUM('MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN_USER') NOT NULL DEFAULT 'ADMIN_USER';

-- ── 4. Drop legacy is_active (fully replaced by status) ──
ALTER TABLE `users` DROP COLUMN `is_active`;

-- ── 5. Create locations table ──
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locations_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 6. Create user_locations table ──
CREATE TABLE `user_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `location_id` INTEGER NOT NULL,
    `assigned_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_locations_user_id_location_id_key`(`user_id`, `location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 7. Create admin_user_permissions table ──
CREATE TABLE `admin_user_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_user_id` INTEGER NOT NULL,
    `location_id` INTEGER NULL,
    `module_name` VARCHAR(50) NOT NULL,
    `can_view` BOOLEAN NOT NULL DEFAULT false,
    `can_create` BOOLEAN NOT NULL DEFAULT false,
    `can_update` BOOLEAN NOT NULL DEFAULT false,
    `can_delete` BOOLEAN NOT NULL DEFAULT false,
    `can_export` BOOLEAN NOT NULL DEFAULT false,
    `assigned_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_user_permissions_admin_user_id_module_name_key`(`admin_user_id`, `module_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 8. Add location_id to business tables (nullable — zero risk) ──
ALTER TABLE `vehicle_records`  ADD COLUMN `location_id` INTEGER NULL;
ALTER TABLE `health_insurance` ADD COLUMN `location_id` INTEGER NULL;
ALTER TABLE `fire_insurance`   ADD COLUMN `location_id` INTEGER NULL;
ALTER TABLE `labour_insurance` ADD COLUMN `location_id` INTEGER NULL;

-- ── 9. Seed a default "Head Office" location so existing data/users don't ──
-- ── go invisible to non-Master-Admin roles after this migration.         ──
INSERT INTO `locations` (`name`, `code`, `status`, `created_at`, `updated_at`)
VALUES ('Head Office', 'HO', 'ACTIVE', NOW(3), NOW(3));

-- ── 10. Backfill every existing user's primary_location_id + user_locations ──
UPDATE `users` SET `primary_location_id` = (SELECT `id` FROM `locations` WHERE `code` = 'HO');

INSERT INTO `user_locations` (`user_id`, `location_id`, `created_at`)
SELECT `id`, (SELECT `id` FROM `locations` WHERE `code` = 'HO'), NOW(3)
FROM `users`;

-- ── 11. Backfill every existing business row to Head Office ──
UPDATE `vehicle_records`  SET `location_id` = (SELECT `id` FROM `locations` WHERE `code` = 'HO');
UPDATE `health_insurance` SET `location_id` = (SELECT `id` FROM `locations` WHERE `code` = 'HO');
UPDATE `fire_insurance`   SET `location_id` = (SELECT `id` FROM `locations` WHERE `code` = 'HO');
UPDATE `labour_insurance` SET `location_id` = (SELECT `id` FROM `locations` WHERE `code` = 'HO');

-- ── 12. Foreign keys (added last, once all data is consistent) ──
ALTER TABLE `users` ADD CONSTRAINT `users_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE `users` ADD CONSTRAINT `users_super_admin_id_fkey` FOREIGN KEY (`super_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE `users` ADD CONSTRAINT `users_primary_location_id_fkey` FOREIGN KEY (`primary_location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `locations` ADD CONSTRAINT `locations_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `user_locations` ADD CONSTRAINT `user_locations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_locations` ADD CONSTRAINT `user_locations_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_locations` ADD CONSTRAINT `user_locations_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `admin_user_permissions` ADD CONSTRAINT `admin_user_permissions_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_user_permissions` ADD CONSTRAINT `admin_user_permissions_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_user_permissions` ADD CONSTRAINT `admin_user_permissions_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `vehicle_records`  ADD CONSTRAINT `vehicle_records_location_id_fkey`  FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `health_insurance` ADD CONSTRAINT `health_insurance_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `fire_insurance`   ADD CONSTRAINT `fire_insurance_location_id_fkey`   FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `labour_insurance` ADD CONSTRAINT `labour_insurance_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
