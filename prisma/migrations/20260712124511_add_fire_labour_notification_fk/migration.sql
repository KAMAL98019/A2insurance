-- AlterTable
ALTER TABLE `notification_logs` ADD COLUMN `fire_insurance_id` INTEGER NULL,
    ADD COLUMN `labour_insurance_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_fire_insurance_id_fkey` FOREIGN KEY (`fire_insurance_id`) REFERENCES `fire_insurance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_labour_insurance_id_fkey` FOREIGN KEY (`labour_insurance_id`) REFERENCES `labour_insurance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
