import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1718000000000 implements MigrationInterface {
  name = 'InitSchema1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'OWNER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" SERIAL NOT NULL,
        "full_name" character varying NOT NULL,
        "phone_number" character varying NOT NULL,
        "address" character varying,
        "note" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_customers_full_name" ON "customers" ("full_name")`);
    await queryRunner.query(`CREATE INDEX "IDX_customers_phone_number" ON "customers" ("phone_number")`);

    // Products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "rental_price" decimal(10,2) NOT NULL,
        "deposit_amount" decimal(10,2) NOT NULL,
        "damage_fee" decimal(10,2) NOT NULL DEFAULT 0,
        "stock_quantity" integer NOT NULL DEFAULT 0,
        "image_url" character varying,
        "category" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_name" ON "products" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_stock_quantity" ON "products" ("stock_quantity")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_category" ON "products" ("category")`);

    // Orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL NOT NULL,
        "customer_id" integer NOT NULL,
        "rental_start_date" date NOT NULL,
        "rental_end_date" date NOT NULL,
        "rental_price" decimal(10,2) NOT NULL,
        "deposit_amount" decimal(10,2) NOT NULL,
        "penalty_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "refund_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "payment_status" character varying NOT NULL DEFAULT 'UNPAID',
        "note" character varying,
        "qr_code_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_rental_start_date" ON "orders" ("rental_start_date")`);

    // Order Items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" SERIAL NOT NULL,
        "order_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" decimal(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("product_id")`);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_customer_id"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order_id"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product_id"
      FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product_id"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_customer_id"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
