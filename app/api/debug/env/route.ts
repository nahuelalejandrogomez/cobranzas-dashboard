export async function GET() {
  const envCheck = {
    // Railway native MySQL vars
    MYSQLHOST: process.env.MYSQLHOST ? 'SET' : 'MISSING',
    MYSQLUSER: process.env.MYSQLUSER ? 'SET' : 'MISSING',
    MYSQLDATABASE: process.env.MYSQLDATABASE ? 'SET' : 'MISSING',
    MYSQLPASSWORD: process.env.MYSQLPASSWORD ? 'SET' : 'MISSING',
    MYSQLPORT: process.env.MYSQLPORT || 'NOT_SET',

    // DB_* variables (fallback)
    DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'SET' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING',
    DB_PORT: process.env.DB_PORT || 'NOT_SET',

    // Valores parciales para verificar (primeros 10 caracteres, seguros de mostrar)
    MYSQLHOST_PARTIAL: process.env.MYSQLHOST?.substring(0, 15) || 'N/A',
    MYSQLDATABASE_PARTIAL: process.env.MYSQLDATABASE || 'N/A',
    DB_HOST_PARTIAL: process.env.DB_HOST?.substring(0, 15) || 'N/A',
    DB_NAME_PARTIAL: process.env.DB_NAME || 'N/A',

    // Valores finales que usará el código
    FINAL_HOST: process.env.MYSQLHOST || process.env.DB_HOST || 'NONE',
    FINAL_DATABASE: process.env.MYSQLDATABASE || process.env.DB_NAME || 'NONE',
  };

  return Response.json(envCheck);
}
