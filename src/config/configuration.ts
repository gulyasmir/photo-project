export default () => ({
  database: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    user: process.env.PG_USER || 'PG',
    password: process.env.PG_PASSWORD || 'password',
    dbName: process.env.PG_DB || 'app_db'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: +process.env.REDIS_PORT  || 6379,
    redis_db: process.env.REDIS_DB || 0
  },
});
