import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  cors: CorsConfig;
  jwt: JwtConfig;
  security: SecurityConfig;
  redis: RedisConfig;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  maxLifetimeSeconds: number;
}

interface JwtConfig {
  accessSecret: string;
  accessExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

interface SecurityConfig {
  saltRounds: number;
  refreshTokenExpiresIn: string;
  emailVerificationExpiresIn: string;
}

interface CorsConfig {
  origin: string | string[] | boolean;
  methods: string;
  allowedHeaders: string;
  credentials: boolean;
}

interface RedisConfig {
  redisUrl: string;
}

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const parseSaltRounds = (value: string | undefined) => {
  const fallback = 10;

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return fallback;
  }

  if (parsed < 4 || parsed > 31) {
    return fallback;
  }

  return parsed;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const config: Config = {
  // server settings
  port: Number(process.env.PORT) || 3000,
  nodeEnv,

  // database settings
  database: {
    host: isProd ? requireEnv('DB_HOST') : process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: isProd
      ? requireEnv('DB_DATABASE')
      : process.env.DB_DATABASE || 'ffp',
    user: isProd ? requireEnv('DB_USER') : process.env.DB_USER || 'postgres',
    password: isProd
      ? requireEnv('DB_PASSWORD')
      : process.env.DB_PASSWORD || 'postgres',
    max: Number(process.env.DB_MAX) || 10,
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 2000,
    maxLifetimeSeconds: Number(process.env.DB_MAX_LIFETIME_SECONDS) || 300,
  },

  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization,X-CSRF-Token',
    credentials: true,
  },

  jwt: {
    accessSecret: isProd
      ? requireEnv('JWT_ACCESS_SECRET')
      : process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: isProd
      ? requireEnv('JWT_REFRESH_SECRET')
      : process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  security: {
    saltRounds: parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS),
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7 days',
    emailVerificationExpiresIn:
      process.env.EMAIL_VERIFICATION_EXPIRES_IN || '1 day',
  },

  redis: {
    redisUrl: isProd
      ? requireEnv('REDIS_URL')
      : process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

export default config;
