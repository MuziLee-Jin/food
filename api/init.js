const db = require('./db');

const initDb = async () => {
  try {
    console.log('Initializing database schema...');
    
    // 创建 dishes 表
    // 注意：tags 使用 text[] 数组类型，spicy 使用 integer
    await db.query(`
      CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        image TEXT,
        tags TEXT[],
        spicy INTEGER DEFAULT 0,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Table "dishes" created or already exists.');
    
    // 检查是否有数据，如果没有则可以后续通过 migrate 脚本导入
    const res = await db.query('SELECT count(*) FROM dishes');
    console.log(`Current dishes count: ${res.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

initDb();
