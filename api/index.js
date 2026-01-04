const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file' });
    }

    let supabaseConfig;
    try {
      supabaseConfig = require('./supabase');
    } catch (e) {
      return res.status(500).json({ error: e?.message || 'Storage not configured' });
    }

    const { supabase, bucket } = supabaseConfig;

    const ext = path.extname(req.file.originalname || '').toLowerCase() || '.png';
    const filePath = `dishes/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return res.json({ url: data.publicUrl, path: filePath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 获取所有菜品
router.get('/dishes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dishes ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 添加菜品
router.post('/dishes', async (req, res) => {
  const { name, category, description, image, tags, spicy, available } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO dishes (name, category, description, image, tags, spicy, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, category, description, image, tags, spicy, available]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 更新菜品
router.put('/dishes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, description, image, tags, spicy, available } = req.body;
  try {
    const current = await db.query('SELECT * FROM dishes WHERE id=$1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Dish not found' });
    }

    const dish = current.rows[0];
    const next = {
      name: typeof name === 'undefined' ? dish.name : name,
      category: typeof category === 'undefined' ? dish.category : category,
      description: typeof description === 'undefined' ? dish.description : description,
      image: typeof image === 'undefined' ? dish.image : image,
      tags: typeof tags === 'undefined' ? dish.tags : tags,
      spicy: typeof spicy === 'undefined' ? dish.spicy : spicy,
      available: typeof available === 'undefined' ? dish.available : available,
    };

    const result = await db.query(
      `UPDATE dishes 
       SET name=$1, category=$2, description=$3, image=$4, tags=$5, spicy=$6, available=$7
       WHERE id=$8 RETURNING *`,
      [next.name, next.category, next.description, next.image, next.tags, next.spicy, next.available, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 删除菜品
router.delete('/dishes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM dishes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Dish not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use('/api', router);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
