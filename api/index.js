import express from 'express'
import cors from 'cors'
import * as db from './db.js'
import { supabase, bucket } from './supabase.js'
import multer from 'multer'
import path from 'path'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    await db.ensureSchema()

    if (!req.file) {
      return res.status(400).json({ error: 'Missing file' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase() || '.png'
    const filePath = `dishes/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message })
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return res.json({ url: data.publicUrl, path: filePath })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/dishes', async (req, res) => {
  try {
    await db.ensureSchema()
    const result = await db.query(
      `
        SELECT
          d.*,
          COALESCE(SUM(oi.quantity), 0)::int AS order_count
        FROM dishes d
        LEFT JOIN order_items oi ON oi.dish_id = d.id
        GROUP BY d.id
        ORDER BY d.id ASC
      `
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/dishes', async (req, res) => {
  const { name, category, description, image, tags, spicy, available } = req.body
  try {
    await db.ensureSchema()
    const result = await db.query(
      `INSERT INTO dishes (name, category, description, image, tags, spicy, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, description, image, tags, spicy, available]
    )
    res.status(201).json({ ...result.rows[0], order_count: 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.put('/dishes/:id', async (req, res) => {
  const { id } = req.params
  const { name, category, description, image, tags, spicy, available } = req.body
  try {
    await db.ensureSchema()
    const current = await db.query('SELECT * FROM dishes WHERE id=$1', [id])
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Dish not found' })
    }

    const dish = current.rows[0]
    const next = {
      name: typeof name === 'undefined' ? dish.name : name,
      category: typeof category === 'undefined' ? dish.category : category,
      description: typeof description === 'undefined' ? dish.description : description,
      image: typeof image === 'undefined' ? dish.image : image,
      tags: typeof tags === 'undefined' ? dish.tags : tags,
      spicy: typeof spicy === 'undefined' ? dish.spicy : spicy,
      available: typeof available === 'undefined' ? dish.available : available,
    }

    const result = await db.query(
      `UPDATE dishes 
       SET name=$1, category=$2, description=$3, image=$4, tags=$5, spicy=$6, available=$7
       WHERE id=$8 RETURNING *`,
      [next.name, next.category, next.description, next.image, next.tags, next.spicy, next.available, id]
    )

    const countResult = await db.query(
      'SELECT COALESCE(SUM(quantity), 0)::int AS order_count FROM order_items WHERE dish_id=$1',
      [id]
    )
    res.json({ ...result.rows[0], order_count: countResult.rows[0]?.order_count ?? 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.delete('/dishes/:id', async (req, res) => {
  const { id } = req.params
  try {
    await db.ensureSchema()
    const result = await db.query('DELETE FROM dishes WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dish not found' })
    }
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/orders', async (req, res) => {
  try {
    await db.ensureSchema()

    const items = Array.isArray(req.body?.items) ? req.body.items : []
    const normalized = items
      .map((i) => ({
        dishId: Number(i?.dishId),
        quantity: Number(i?.quantity ?? i?.count),
        note: typeof i?.note === 'string' ? i.note : (typeof i?.notes === 'string' ? i.notes : ''),
      }))
      .filter((i) => Number.isFinite(i.dishId) && Number.isFinite(i.quantity) && i.quantity > 0)

    if (normalized.length === 0) {
      return res.status(400).json({ error: 'Missing items' })
    }

    const client = await db.getClient()
    try {
      await client.query('BEGIN')
      const orderResult = await client.query('INSERT INTO orders DEFAULT VALUES RETURNING id')
      const orderId = orderResult.rows[0].id

      for (const item of normalized) {
        await client.query(
          'INSERT INTO order_items (order_id, dish_id, quantity, note) VALUES ($1, $2, $3, $4)',
          [orderId, item.dishId, item.quantity, item.note]
        )
      }

      await client.query('COMMIT')
      return res.status(201).json({ orderId })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.use('/api', router)
app.use('/', router)

export default app

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}
