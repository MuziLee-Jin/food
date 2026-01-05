import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
})

let schemaReadyPromise

export const ensureSchema = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id bigserial PRIMARY KEY,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `)

      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id bigserial PRIMARY KEY,
          order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          dish_id bigint NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
          quantity integer NOT NULL CHECK (quantity > 0),
          note text,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `)

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON order_items(dish_id)
      `)
    })()
  }

  return schemaReadyPromise
}

export const query = (text, params) => pool.query(text, params)

export const getClient = () => pool.connect()
