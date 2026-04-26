import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuth1745100000000 implements MigrationInterface {
  name = 'AddGoogleAuth1745100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`password\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`provider\` enum('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD COLUMN \`googleId\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_users_googleId\` (\`googleId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_users_googleId\``,
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`googleId\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`provider\` enum('LOCAL') NOT NULL DEFAULT 'LOCAL'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY COLUMN \`password\` varchar(255) NOT NULL`,
    );
  }
}
