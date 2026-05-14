-- AlterEnum
ALTER TABLE `users` MODIFY COLUMN `provider` ENUM('LOCAL', 'GOOGLE', 'APPLE') NOT NULL DEFAULT 'LOCAL';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `appleId` VARCHAR(255) NULL,
    ADD UNIQUE INDEX `users_appleId_key`(`appleId`);
