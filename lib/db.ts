import mysql from 'mysql2/promise';

// Pool reiniciado - v3
let pool: mysql.Pool | null = null;

export async function getPool() {
  if (pool) {
    return pool;
  }

  // Usando DB_* (Railway) - v4
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || 3306);

  console.log('[DB] Creating pool - Host:', host, 'Database:', database, 'Port:', port);

  if (!host || !user || !password || !database) {
    console.error('[DB] Missing connection parameters:', { host, user, database, port });
    throw new Error('Database configuration incomplete');
  }

  try {
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 30000,
      // Importante para Railway/serverless
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('[DB] Pool created and connection tested successfully');
    connection.release();

    return pool;
  } catch (error) {
    console.error('[DB] Failed to create pool:', error);
    pool = null;
    throw error;
  }
}

export async function executeQuery(query: string, values?: any[]) {
  let connection;
  try {
    const dbPool = await getPool();
    connection = await dbPool.getConnection();
    const [results] = await connection.execute(query, values);
    return results;
  } catch (error) {
    console.error('[DB] Query error:', error);
    // Reset pool on connection errors
    if (error instanceof Error &&
        (error.message.includes('ECONNREFUSED') ||
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('PROTOCOL_CONNECTION_LOST'))) {
      console.log('[DB] Resetting pool due to connection error');
      pool = null;
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
