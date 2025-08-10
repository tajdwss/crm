import 'dotenv/config';
import { Router } from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Configuration
const CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL,
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  BACKUP_PREFIX: 'taj_crm_backup',
  LOG_FILE: './logs/backup.log'
};

// Ensure directories exist
function ensureDirectories() {
  const dirs = [CONFIG.BACKUP_DIR, './logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Parse DATABASE_URL
function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port || '5432',
      username: parsed.username || 'postgres',
      password: parsed.password || '',
      database: parsed.pathname.slice(1) || 'postgres'
    };
  } catch (error) {
    // Fallback for simple connection strings
    return {
      host: 'localhost',
      port: '5432',
      username: 'taj_user',
      password: process.env.DATABASE_PASSWORD || '',
      database: 'taj_crm'
    };
  }
}

// Generate backup filename
function generateBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  
  return `${CONFIG.BACKUP_PREFIX}_${timestamp}.sql`; // Remove .gz for now
}

// Log function
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  try {
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Get backup statistics
function getBackupStats() {
  try {
    ensureDirectories();
    const files = fs.readdirSync(CONFIG.BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith(CONFIG.BACKUP_PREFIX));
    
    let totalSize = 0;
    const stats = backupFiles.map(filename => {
      const filePath = path.join(CONFIG.BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      totalSize += stat.size;
      return {
        filename,
        size: stat.size,
        created: stat.mtime,
        sizeMB: Math.round(stat.size / 1024 / 1024 * 100) / 100
      };
    });
    
    return {
      success: true,
      count: backupFiles.length,
      totalSize: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      files: stats.sort((a, b) => b.created.getTime() - a.created.getTime())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      count: 0,
      totalSize: 0,
      totalSizeMB: 0,
      files: []
    };
  }
}

// Create backup with better error handling and debugging
function createBackup(): Promise<{ success: boolean; message: string; filename?: string; sizeMB?: number }> {
  return new Promise((resolve) => {
    try {
      ensureDirectories();
      
      if (!CONFIG.DATABASE_URL) {
        resolve({ success: false, message: 'DATABASE_URL not configured' });
        return;
      }
      
      const dbConfig = parseDatabaseUrl(CONFIG.DATABASE_URL);
      console.log('Database config:', { ...dbConfig, password: '***' });
      
      const backupFilename = generateBackupFilename().replace('.gz', ''); // Remove .gz for now
      const backupPath = path.join(CONFIG.BACKUP_DIR, backupFilename);
      
      log(`Starting manual backup: ${backupFilename}`);
      log(`Database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
      
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
        PGHOST: dbConfig.host,
        PGPORT: dbConfig.port.toString(),
        PGUSER: dbConfig.username,
        PGDATABASE: dbConfig.database
      };
      
      // Test pg_dump availability first
      const testArgs = ['--version'];
      const testPgDump = spawn('pg_dump', testArgs, { stdio: 'pipe' });
      
      testPgDump.on('error', (error) => {
        log(`pg_dump not found: ${error.message}`);
        resolve({ 
          success: false, 
          message: 'pg_dump command not found. Please install PostgreSQL client tools.' 
        });
        return;
      });
      
      testPgDump.on('close', (code) => {
        if (code !== 0) {
          resolve({ success: false, message: 'pg_dump command failed' });
          return;
        }
        
        // Now run actual backup
        const pgDumpArgs = [
          '--verbose',
          '--clean',
          '--no-owner',
          '--no-privileges',
          '--format=plain',
          '--file', backupPath,
          dbConfig.database
        ];
        
        log(`Running: pg_dump ${pgDumpArgs.join(' ')}`);
        
        const pgDump = spawn('pg_dump', pgDumpArgs, { 
          env,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let errorOutput = '';
        let stdOutput = '';
        
        pgDump.stdout.on('data', (data) => {
          stdOutput += data.toString();
        });
        
        pgDump.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        pgDump.on('error', (error) => {
          log(`pg_dump spawn error: ${error.message}`);
          resolve({ success: false, message: `Spawn error: ${error.message}` });
        });
        
        pgDump.on('close', (code) => {
          log(`pg_dump exited with code: ${code}`);
          log(`stderr: ${errorOutput}`);
          log(`stdout: ${stdOutput}`);
          
          if (code === 0) {
            try {
              if (fs.existsSync(backupPath)) {
                const stats = fs.statSync(backupPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                log(`Backup completed successfully: ${backupFilename} (${sizeMB} MB)`);
                resolve({
                  success: true,
                  message: 'Backup created successfully',
                  filename: backupFilename,
                  sizeMB: parseFloat(sizeMB)
                });
              } else {
                resolve({ success: false, message: 'Backup file was not created' });
              }
            } catch (err) {
              resolve({ success: false, message: `File verification failed: ${err.message}` });
            }
          } else {
            resolve({ 
              success: false, 
              message: `pg_dump failed (code ${code}): ${errorOutput || 'Unknown error'}` 
            });
          }
        });
      });
      
    } catch (error: any) {
      log(`Backup error: ${error.message}`);
      resolve({ success: false, message: error.message });
    }
  });
}

// API Routes

// Get backup statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = getBackupStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create manual backup
router.post('/create', async (req, res) => {
  try {
    log('Manual backup requested from admin panel');
    const result = await createBackup();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Download backup file
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename
    if (!filename.startsWith(CONFIG.BACKUP_PREFIX) || !filename.endsWith('.sql.gz')) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = path.join(CONFIG.BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    log(`Backup download requested: ${filename}`);
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/gzip');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete backup file
router.delete('/delete/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename
    if (!filename.startsWith(CONFIG.BACKUP_PREFIX)) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = path.join(CONFIG.BACKUP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    fs.unlinkSync(filePath);
    log(`Backup deleted: ${filename}`);
    
    res.json({ 
      success: true, 
      message: `Backup ${filename} deleted successfully` 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;



