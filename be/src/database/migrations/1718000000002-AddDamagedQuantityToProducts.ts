import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDamagedQuantityToProducts1718000000002
  implements MigrationInterface
{
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
