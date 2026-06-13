import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../../common/constants/roles.constant';
import { Category } from '../../modules/category/category.entity';
import { Product } from '../../modules/product/product.entity';
import { ShopSettings } from '../../modules/shop/shop.entity';
import { User } from '../../modules/user/user.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const categorySeeds = [
  {
    name: 'Vay da hoi',
    description: 'Dam du tiec, su kien, chup anh va le hoi.',
  },
  {
    name: 'Ao dai',
    description: 'Ao dai cho chup anh, ky yeu va nghi le.',
  },
  {
    name: 'Vest',
    description: 'Vest nam cho su kien, cuoi hoi va buoi trang trong.',
  },
  {
    name: 'Phu kien',
    description: 'No, ca vat, mang to, gang tay va phu kien di kem.',
  },
] as const;

const productSeeds = [
  {
    name: 'Dam da hoi do ruby',
    description: 'Dam da hoi form om, hop tiec cuoi va chup anh studio.',
    rentalPrice: 350000,
    depositAmount: 800000,
    damageFee: 500000,
    stockQuantity: 4,
    damagedQuantity: 0,
    categoryName: 'Vay da hoi',
  },
  {
    name: 'Dam da hoi den basic',
    description: 'Mau den de mac, phu hop nhieu phong cach su kien.',
    rentalPrice: 280000,
    depositAmount: 700000,
    damageFee: 450000,
    stockQuantity: 5,
    damagedQuantity: 1,
    categoryName: 'Vay da hoi',
  },
  {
    name: 'Ao dai trang truyen thong',
    description: 'Ao dai ton dang cho chup anh ky yeu va le hoi.',
    rentalPrice: 220000,
    depositAmount: 500000,
    damageFee: 300000,
    stockQuantity: 6,
    damagedQuantity: 0,
    categoryName: 'Ao dai',
  },
  {
    name: 'Ao dai do gam',
    description: 'Ao dai tong do noi bat cho ngay le va chup anh cap doi.',
    rentalPrice: 250000,
    depositAmount: 550000,
    damageFee: 320000,
    stockQuantity: 3,
    damagedQuantity: 0,
    categoryName: 'Ao dai',
  },
  {
    name: 'Vest xanh navy cao cap',
    description: 'Vest nam 2 khuy, phu hop dam cuoi va su kien doanh nghiep.',
    rentalPrice: 320000,
    depositAmount: 900000,
    damageFee: 600000,
    stockQuantity: 4,
    damagedQuantity: 0,
    categoryName: 'Vest',
  },
  {
    name: 'Vest den slimfit',
    description: 'Vest nam dang slimfit de pho i voi so mi trang va no.',
    rentalPrice: 300000,
    depositAmount: 850000,
    damageFee: 550000,
    stockQuantity: 4,
    damagedQuantity: 1,
    categoryName: 'Vest',
  },
  {
    name: 'Set no va khan tui cuoi',
    description: 'Bo phu kien dung kem vest cho le cuoi va tiec toi.',
    rentalPrice: 80000,
    depositAmount: 150000,
    damageFee: 100000,
    stockQuantity: 10,
    damagedQuantity: 0,
    categoryName: 'Phu kien',
  },
  {
    name: 'Gang tay ren chup anh',
    description: 'Gang tay ren danh cho dam da hoi va concept chup anh co dien.',
    rentalPrice: 60000,
    depositAmount: 120000,
    damageFee: 80000,
    stockQuantity: 8,
    damagedQuantity: 0,
    categoryName: 'Phu kien',
  },
] as const;

const shopSeed = {
  shopName: 'UniCo',
  legalName: 'Ho kinh doanh UniCo',
  hotline: '0909 123 456',
  email: 'hello@unico.vn',
  address: '123 Nguyen Trai, Quan 5, TP HCM',
  taxCode: '0312345678',
  bankName: 'Vietcombank',
  bankAccountNumber: '0123456789',
  bankAccountName: 'HO KINH DOANH UNICO',
  invoiceFooter: 'Cam on quy khach va hen gap lai.',
} as const;

async function upsertCategory(
  categoryRepo: Repository<Category>,
  seedData: (typeof categorySeeds)[number],
) {
  const existing = await categoryRepo.findOne({
    where: { name: seedData.name },
  });

  const entity = existing ?? categoryRepo.create();
  entity.name = seedData.name;
  entity.description = seedData.description;

  await categoryRepo.save(entity);
  console.log(`${existing ? 'Updated' : 'Created'} category: ${seedData.name}`);

  return entity;
}

async function upsertProduct(
  productRepo: Repository<Product>,
  categoryMap: Map<string, Category>,
  seedData: (typeof productSeeds)[number],
) {
  const existing = await productRepo.findOne({
    where: { name: seedData.name },
  });

  const category = categoryMap.get(seedData.categoryName);
  if (!category) {
    throw new Error(`Missing category for product seed: ${seedData.categoryName}`);
  }

  const entity = existing ?? productRepo.create();
  entity.name = seedData.name;
  entity.description = seedData.description;
  entity.rentalPrice = seedData.rentalPrice;
  entity.depositAmount = seedData.depositAmount;
  entity.damageFee = seedData.damageFee;
  entity.stockQuantity = seedData.stockQuantity;
  entity.damagedQuantity = seedData.damagedQuantity;
  entity.category = category.name;
  entity.categoryId = category.id;

  await productRepo.save(entity);
  console.log(`${existing ? 'Updated' : 'Created'} product: ${seedData.name}`);
}

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'clothing_rental',
    entities: [User, Category, Product, ShopSettings],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  try {
    const userRepo = dataSource.getRepository(User);
    const categoryRepo = dataSource.getRepository(Category);
    const productRepo = dataSource.getRepository(Product);
    const shopRepo = dataSource.getRepository(ShopSettings);

    const existingUser = await userRepo.findOne({
      where: { username: 'admin' },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const user = userRepo.create({
        username: 'admin',
        password: hashedPassword,
        fullName: 'Chu cua hang',
        role: Role.OWNER,
      });
      await userRepo.save(user);
      console.log('Created admin user: admin / admin123');
    } else {
      console.log('Admin user already exists');
    }

    const categoryMap = new Map<string, Category>();
    for (const categorySeed of categorySeeds) {
      const category = await upsertCategory(categoryRepo, categorySeed);
      categoryMap.set(category.name, category);
    }

    for (const productSeed of productSeeds) {
      await upsertProduct(productRepo, categoryMap, productSeed);
    }

    const existingShopSettings = await shopRepo.find({
      order: { id: 'ASC' },
      take: 1,
    });

    const shopSettings = existingShopSettings[0] ?? shopRepo.create();
    Object.assign(shopSettings, shopSeed);
    await shopRepo.save(shopSettings);
    console.log(
      `${existingShopSettings[0] ? 'Updated' : 'Created'} shop settings: ${shopSeed.shopName}`,
    );
  } finally {
    await dataSource.destroy();
    console.log('Done');
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
