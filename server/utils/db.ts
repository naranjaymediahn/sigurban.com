import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function parseDatabaseUrl(databaseUrl: string) {
  const match = databaseUrl.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (!match) {
    throw new Error('DATABASE_URL tiene formato inválido.')
  }

  const [, user, password, host, port, database] = match
  return {
    host,
    port: Number(port) || 3306,
    user,
    password,
    database,
  }
}

export function getPool() {
  if (!pool) {
    const config = useRuntimeConfig()
    const directUrl = process.env.DATABASE_URL || ''
    const fromUrl = directUrl ? parseDatabaseUrl(directUrl) : null
    const envConfig = {
      host: process.env.MYSQL_HOST || config.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || config.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || config.MYSQL_USER,
      password: process.env.MYSQL_PASS || config.MYSQL_PASS,
      database: process.env.MYSQL_DB || config.MYSQL_DB,
    }

    pool = mysql.createPool({
      host: fromUrl?.host || envConfig.host,
      port: fromUrl?.port || envConfig.port,
      user: fromUrl?.user || envConfig.user,
      password: fromUrl?.password || envConfig.password,
      database: fromUrl?.database || envConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      ssl: false,
      timezone: '-06:00',
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}
