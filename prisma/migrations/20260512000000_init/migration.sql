-- TypeORM으로 생성된 초기 users 테이블 (Prisma 마이그레이션 이전 상태)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NULL,
    `googleId` VARCHAR(255) NULL,
    `birthDate` DATE NOT NULL,
    `countryCode` VARCHAR(10) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `profileImageUrl` VARCHAR(500) NULL,
    `provider` ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `refreshToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_googleId_key`(`googleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
