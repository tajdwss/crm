
import express from 'express';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Basic auth middleware for admin routes
const adminAuth = (req: any, res: any, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.DB_ADMIN_TOKEN || 'admin123'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get database info
router.get('/info', adminAuth, async (req, res) => {
  try {
    const version = await db.execute(sql`SELECT version()`);
    const tables = await db.execute(sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      version: version.rows[0],
      tables: tables.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get table structure
router.get('/table/:tableName', adminAuth, async (req, res) => {
  try {
    const { tableName } = req.params;
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const data = await db.execute(sql`SELECT * FROM ${sql.identifier(tableName)} LIMIT 100`);
    
    res.json({
      columns: columns.rows,
      data: data.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Execute custom query
router.post('/query', adminAuth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const result = await db.execute(sql.raw(query));
    res.json({
      rows: result.rows,
      rowCount: result.rowCount || result.rows?.length || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as dbAdminRouter };
