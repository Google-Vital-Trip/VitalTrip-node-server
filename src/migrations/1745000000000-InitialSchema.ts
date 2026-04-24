import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1745000000000 implements MigrationInterface {
  name = 'InitialSchema1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(255) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`birthDate\` date NOT NULL,
        \`countryCode\` varchar(10) NOT NULL,
        \`phoneNumber\` varchar(20) NOT NULL,
        \`profileImageUrl\` varchar(500) NULL,
        \`provider\` enum('LOCAL') NOT NULL DEFAULT 'LOCAL',
        \`refreshToken\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
