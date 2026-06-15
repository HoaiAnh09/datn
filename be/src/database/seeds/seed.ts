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
    name: 'Váy dạ hội',
    description: 'Đầm dự tiệc, sự kiện, chụp ảnh và lễ hội.',
  },
  {
    name: 'Áo dài',
    description: 'Áo dài cho chụp ảnh, kỷ yếu và nghi lễ.',
  },
  {
    name: 'Vest',
    description: 'Vest nam cho sự kiện, cưới hỏi và buổi trang trọng.',
  },
  {
    name: 'Phụ kiện',
    description: 'Nơ, cà vạt, măng tô, găng tay và phụ kiện đi kèm.',
  },
] as const;

const productSeeds = [
  {
    name: 'Đầm dạ hội đỏ ruby',
    description: 'Đầm dạ hội form ôm, hợp tiệc cưới và chụp ảnh studio.',
    rentalPrice: 350000,
    depositAmount: 800000,
    damageFee: 500000,
    stockQuantity: 4,
    damagedQuantity: 0,
    categoryName: 'Váy dạ hội',
  },
  {
    name: 'Đầm dạ hội đen basic',
    description: 'Mẫu đen dễ mặc, phù hợp nhiều phong cách sự kiện.',
    rentalPrice: 280000,
    depositAmount: 700000,
    damageFee: 450000,
    stockQuantity: 5,
    damagedQuantity: 1,
    categoryName: 'Váy dạ hội',
  },
  {
    name: 'Áo dài trắng truyền thống',
    description: 'Áo dài tôn dáng cho chụp ảnh kỷ yếu và lễ hội.',
    rentalPrice: 220000,
    depositAmount: 500000,
    damageFee: 300000,
    stockQuantity: 6,
    damagedQuantity: 0,
    categoryName: 'Áo dài',
  },
  {
    name: 'Áo dài đỏ gấm',
    description: 'Áo dài tông đỏ nổi bật cho ngày lễ và chụp ảnh cặp đôi.',
    rentalPrice: 250000,
    depositAmount: 550000,
    damageFee: 320000,
    stockQuantity: 3,
    damagedQuantity: 0,
    categoryName: 'Áo dài',
  },
  {
    name: 'Vest xanh navy cao cấp',
    description: 'Vest nam 2 khuy, phù hợp đám cưới và sự kiện doanh nghiệp.',
    rentalPrice: 320000,
    depositAmount: 900000,
    damageFee: 600000,
    stockQuantity: 4,
    damagedQuantity: 0,
    categoryName: 'Vest',
  },
  {
    name: 'Vest đen slimfit',
    description: 'Vest nam dáng slimfit dễ phối với sơ mi trắng và nơ.',
    rentalPrice: 300000,
    depositAmount: 850000,
    damageFee: 550000,
    stockQuantity: 4,
    damagedQuantity: 1,
    categoryName: 'Vest',
  },
  {
    name: 'Set nơ và khăn túi cưới',
    description: 'Bộ phụ kiện dùng kèm vest cho lễ cưới và tiệc tối.',
    rentalPrice: 80000,
    depositAmount: 150000,
    damageFee: 100000,
    stockQuantity: 10,
    damagedQuantity: 0,
    categoryName: 'Phụ kiện',
  },
  {
    name: 'Găng tay ren chụp ảnh',
    description: 'Găng tay ren dành cho đầm dạ hội và concept chụp ảnh cổ điển.',
    rentalPrice: 60000,
    depositAmount: 120000,
    damageFee: 80000,
    stockQuantity: 8,
    damagedQuantity: 0,
    categoryName: 'Phụ kiện',
  },
] as const;

const shopSeed = {
  shopName: 'UniCo',
  legalName: 'Hộ kinh doanh UniCo',
  hotline: '0909 123 456',
  email: 'hello@unico.vn',
  address: '123 Nguyễn Trãi, Quận 5, TP HCM',
  taxCode: '0312345678',
  bankName: 'Vietcombank',
  bankAccountNumber: '0123456789',
  bankAccountName: 'HỘ KINH DOANH UNICO',
  invoiceFooter: 'Cảm ơn quý khách và hẹn gặp lại.',
  heroTitle: 'Chọn trang phục đẹp, gửi yêu cầu nhanh và nhận đồ đúng hẹn cho ngày quan trọng của bạn.',
  heroSubtitle: 'Tìm sản phẩm phù hợp, thêm vào giỏ, gửi yêu cầu đặt thuê và chờ cửa hàng xác nhận. Mọi thông tin chi tiết về lịch thuê sẽ được chọn ngay khi bạn đặt sản phẩm.',
} as const;

const userSeeds = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Chủ cửa hàng',
    phoneNumber: '0900000000',
    address: '123 Nguyễn Trãi, Quận 5, TP HCM',
    role: Role.OWNER,
  },
  {
    username: 'khachhang1',
    password: 'khach123',
    fullName: 'Khách hàng 01',
    phoneNumber: '0901234567',
    address: '45 Lê Lợi, Quận 1, TP HCM',
    role: Role.CUSTOMER,
  },
] as const;

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

async function upsertUser(
  userRepo: Repository<User>,
  seedData: (typeof userSeeds)[number],
) {
  const existing = await userRepo.findOne({
    where: { username: seedData.username },
  });

  const hashedPassword = await bcrypt.hash(seedData.password, 10);
  const entity = existing ?? userRepo.create();
  entity.username = seedData.username;
  entity.password = hashedPassword;
  entity.fullName = seedData.fullName;
  entity.phoneNumber = seedData.phoneNumber;
  entity.address = seedData.address;
  entity.role = seedData.role;

  await userRepo.save(entity);
  console.log(
    `${existing ? 'Updated' : 'Created'} user: ${seedData.username} / ${seedData.password}`,
  );
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

    for (const userSeed of userSeeds) {
      await upsertUser(userRepo, userSeed);
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
