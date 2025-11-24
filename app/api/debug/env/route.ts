export async function GET() {
  const envCheck = {
    COBRANZA_DB_HOST: process.env.COBRANZA_DB_HOST ? 'SET' : 'MISSING',
    COBRANZA_DB_USER: process.env.COBRANZA_DB_USER ? 'SET' : 'MISSING',
    COBRANZA_DB_NAME: process.env.COBRANZA_DB_NAME ? 'SET' : 'MISSING',
    COBRANZA_DB_PASSWORD: process.env.COBRANZA_DB_PASSWORD ? 'SET' : 'MISSING',
    COBRANZA_DB_PORT: process.env.COBRANZA_DB_PORT || 'NOT_SET (default: 3306)',

    // También verificar las viejas variables
    DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'SET' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING',
    DB_PORT: process.env.DB_PORT || 'NOT_SET (default: 3306)',

    // Valores parciales (primeros 3 caracteres)
    COBRANZA_DB_HOST_PARTIAL: process.env.COBRANZA_DB_HOST?.substring(0, 3) || 'N/A',
    COBRANZA_DB_NAME_PARTIAL: process.env.COBRANZA_DB_NAME?.substring(0, 3) || 'N/A',
  };

  return Response.json(envCheck);
}
