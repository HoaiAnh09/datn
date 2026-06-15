import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1718000000000 implements MigrationInterface {
  name = 'InitSchema1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('OWNER', 'CUSTOMER')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'RENTING', 'RETURNED', 'CANCELLED')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('UNPAID', 'DEPOSIT_PAID', 'REFUNDED')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."orders_source_enum" AS ENUM('OWNER_DIRECT', 'CUSTOMER_REQUEST')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."rental_requests_status_enum" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "full_name" character varying NOT NULL,
        "phone_number" character varying,
        "address" character varying,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'OWNER',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_phone_number" ON "users" ("phone_number")`,
    );

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
    await queryRunner.query(
      `CREATE INDEX "IDX_categories_name" ON "categories" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "rental_price" decimal(10,2) NOT NULL,
        "deposit_amount" decimal(10,2) NOT NULL,
        "damage_fee" decimal(10,2) NOT NULL DEFAULT 0,
        "stock_quantity" integer NOT NULL DEFAULT 0,
        "damaged_quantity" integer NOT NULL DEFAULT 0,
        "image_url" character varying,
        "category" character varying,
        "category_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_name" ON "products" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_stock_quantity" ON "products" ("stock_quantity")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_category" ON "products" ("category")`,
    );

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
      CREATE TABLE "rental_requests" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "rental_start_date" date NOT NULL,
        "rental_end_date" date NOT NULL,
        "status" "public"."rental_requests_status_enum" NOT NULL DEFAULT 'SUBMITTED',
        "note" character varying,
        "review_note" character varying,
        "approved_order_id" integer,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_rental_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_rental_requests_user_id" ON "rental_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rental_requests_status" ON "rental_requests" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL NOT NULL,
        "renter_user_id" integer,
        "renter_full_name" character varying NOT NULL,
        "renter_phone_number" character varying,
        "renter_address" character varying,
        "request_id" integer,
        "source" "public"."orders_source_enum" NOT NULL DEFAULT 'OWNER_DIRECT',
        "rental_start_date" date NOT NULL,
        "rental_end_date" date NOT NULL,
        "rental_price" decimal(10,2) NOT NULL,
        "deposit_amount" decimal(10,2) NOT NULL,
        "penalty_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "refund_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING',
        "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'UNPAID',
        "note" character varying,
        "qr_code_url" character varying,
        "pickup_deadline_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_renter_user_id" ON "orders" ("renter_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_rental_start_date" ON "orders" ("rental_start_date")`,
    );

    await queryRunner.query(`
      CREATE TABLE "rental_request_items" (
        "id" SERIAL NOT NULL,
        "request_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" decimal(10,2) NOT NULL,
        "deposit_amount" decimal(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_rental_request_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_rental_request_items_request_id" ON "rental_request_items" ("request_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rental_request_items_product_id" ON "rental_request_items" ("product_id")`,
    );

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
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("product_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_products_category_id"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "rental_requests"
      ADD CONSTRAINT "FK_rental_requests_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_renter_user_id"
      FOREIGN KEY ("renter_user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "rental_request_items"
      ADD CONSTRAINT "FK_rental_request_items_request_id"
      FOREIGN KEY ("request_id") REFERENCES "rental_requests"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "rental_request_items"
      ADD CONSTRAINT "FK_rental_request_items_product_id"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_order_id"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_product_id"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rental_request_items" DROP CONSTRAINT "FK_rental_request_items_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rental_request_items" DROP CONSTRAINT "FK_rental_request_items_request_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_renter_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rental_requests" DROP CONSTRAINT "FK_rental_requests_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_products_category_id"`,
    );

    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "rental_request_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "rental_requests"`);
    await queryRunner.query(`DROP TABLE "shop_settings"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."rental_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
