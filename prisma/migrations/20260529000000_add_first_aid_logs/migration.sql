-- CreateTable
CREATE TABLE `first_aid_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `symptomType` ENUM('BLEEDING', 'BURNS', 'FRACTURE', 'ALLERGIC_REACTION', 'SEIZURE', 'HEATSTROKE', 'HYPOTHERMIA', 'POISONING', 'BREATHING_DIFFICULTY', 'ANIMAL_BITE', 'FALL_INJURY') NOT NULL,
    `countryCode` VARCHAR(10) NOT NULL,
    `confidence` INTEGER NOT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `first_aid_logs_symptomType_idx`(`symptomType`),
    INDEX `first_aid_logs_countryCode_idx`(`countryCode`),
    INDEX `first_aid_logs_requestedAt_idx`(`requestedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `first_aid_logs` ADD CONSTRAINT `first_aid_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
