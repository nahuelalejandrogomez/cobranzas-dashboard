import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function executeQuery(query: string, values?: any[]) {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.execute(query, values);
      return results;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}
