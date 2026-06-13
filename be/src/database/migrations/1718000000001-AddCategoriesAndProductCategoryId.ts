import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesAndProductCategoryId1718000000001
  implements MigrationInterface
{
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
