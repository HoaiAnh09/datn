import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config({ path: path.resolve(__dirname, '.env') });

import { User } from './src/modules/user/user.entity';
import { Product } from './src/modules/product/product.entity';
import { Order, OrderItem } from './src/modules/order/order.entity';
import { Category } from './src/modules/category/category.entity';
import {
  RentalRequest,
  RentalRequestItem,
} from './src/modules/rental-request/rental-request.entity';
import { ShopSettings } from './src/modules/shop/shop.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'clothing_rental',
  synchronize: false,
  logging: true,
  entities: [
    User,
    Category,
    Product,
    Order,
    OrderItem,
    RentalRequest,
    RentalRequestItem,
    ShopSettings,
  ],
  migrations: [path.resolve(__dirname, 'src/database/migrations/*.ts')],
});
