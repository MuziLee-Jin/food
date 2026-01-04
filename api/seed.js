const db = require('./db');
// 手动复制 mock 数据，避免 require ES module 问题
const initialDishes = [
  {
    name: '红烧肉',
    description: '肥而不腻，经典本帮口味',
    category: '热菜',
    tags: ['推荐', '耗时'],
    spicy: 0,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    name: '拍黄瓜',
    description: '清爽解腻，加了蒜泥',
    category: '凉菜',
    tags: ['快手'],
    spicy: 1,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    name: '酸辣土豆丝',
    description: '脆爽口感',
    category: '热菜',
    tags: ['素食'],
    spicy: 2,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    name: '番茄炒蛋',
    description: '国民下饭菜，甜口',
    category: '热菜',
    tags: ['儿童喜爱'],
    spicy: 0,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  },
  {
    name: '可乐',
    description: '冰镇快乐水',
    category: '饮料',
    tags: [],
    spicy: 0,
    image: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    available: true
  }
];

const seed = async () => {
  try {
    console.log('Seeding data...');
    
    // 先清空表 (可选)
    // await db.query('TRUNCATE TABLE dishes RESTART IDENTITY');

    const res = await db.query('SELECT count(*) FROM dishes');
    if (parseInt(res.rows[0].count) > 0) {
        console.log('Database already has data, skipping seed.');
        process.exit(0);
    }

    for (const dish of initialDishes) {
      await db.query(
        `INSERT INTO dishes (name, description, category, tags, spicy, image, available)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [dish.name, dish.description, dish.category, dish.tags, dish.spicy, dish.image, dish.available]
      );
    }

    console.log(`Seeded ${initialDishes.length} dishes successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seed();
