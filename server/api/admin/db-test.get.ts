import { getPool } from '../../utils/db'

function maskDatabaseUrl(url: string) {
  return url.replace(/:([^@]+)@/, ':***@')
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const databaseUrl = process.env.DATABASE_URL || ''
  const envConnection = {
    host: process.env.MYSQL_HOST || config.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || config.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || config.MYSQL_USER,
    database: process.env.MYSQL_DB || config.MYSQL_DB,
  }

  const connection = databaseUrl
    ? {
        source: 'DATABASE_URL',
        value: maskDatabaseUrl(databaseUrl),
      }
    : {
        source: 'env/runtimeConfig',
        value: envConnection,
      }

  try {
    const pool = getPool()
    const [rows] = await pool.query(
      'SELECT 1 AS ok, VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS current_user'
    )

    return {
      status: 'OK',
      connection,
      result: rows,
    }
  } catch (err: any) {
    return {
      status: 'ERROR',
      connection,
      error: {
        message: err?.message,
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState,
      },
    }
  }
})
