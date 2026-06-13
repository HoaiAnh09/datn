import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopSettings1718000000003 implements MigrationInterface {
  name = 'AddShopSettings1718000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shop_settings" (
        "id" SERIAL NOT NULL,
        "shop_name" character varying NOT NULL DEFAULT 'UniCo Rental',
        "legal_name" character varying,
        "hotline" character varying NOT NULL DEFAULT '0900 000 000',
        "email" character varying,
        "address" character varying,
        "tax_code" character varying,
        "bank_name" character varying,
        "bank_account_number" character varying,
        "bank_account_name" character varying,
        "invoice_footer" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_shop_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "shop_settings" (
        "shop_name",
        "hotline",
        "address",
        "invoice_footer"
      ) VALUES (
        'UniCo Rental',
        '0900 000 000',
        'Cua hang cho thue trang phuc',
        'Cam on quy khach va hen gap lai'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "shop_settings"`);
  }
}
