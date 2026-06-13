import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDamagedQuantityToProducts1718000000002
  implements MigrationInterface
{
  name = 'AddDamagedQuantityToProducts1718000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD "damaged_quantity" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "damaged_quantity"
    `);
  }
}
