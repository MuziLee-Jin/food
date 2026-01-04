import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // 大多数云数据库（包括 Supabase）在生产环境需要这个配置
  },
  // 针对 Serverless 环境优化的配置
  max: 1, // 限制单个 Serverless 函数的连接数
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

export const query = (text, params) => pool.query(text, params);
