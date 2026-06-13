import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesAndProductCategoryId1718000000001 implements MigrationInterface {
  name = 'AddCategoriesAndProductCategoryId1718000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_categories_name" ON "categories" ("name")`);

    // Add category_id column to products
    await queryRunner.query(`ALTER TABLE "products" ADD "category_id" integer`);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "products" ADD CONSTRAINT "FK_products_category_id"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
