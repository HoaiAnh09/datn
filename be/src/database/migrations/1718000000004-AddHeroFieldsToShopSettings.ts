import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeroFieldsToShopSettings1718000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shop_settings" ADD COLUMN "hero_title" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_settings" ADD COLUMN "hero_subtitle" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shop_settings" DROP COLUMN "hero_subtitle"`);
    await queryRunner.query(`ALTER TABLE "shop_settings" DROP COLUMN "hero_title"`);
  }
}
