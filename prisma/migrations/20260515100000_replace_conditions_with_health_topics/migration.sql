DROP TABLE IF EXISTS `conditions`;

CREATE TABLE `health_topics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `altTitles` TEXT NOT NULL,
    `summary` TEXT NOT NULL,
    `fullSummary` LONGTEXT NOT NULL,
    `categories` TEXT NOT NULL,
    `meshTerms` TEXT NOT NULL,
    `url` VARCHAR(500) NOT NULL,

    UNIQUE INDEX `health_topics_url_key`(`url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
