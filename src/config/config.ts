import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    database: DatabaseConfig;
    cors: CorsConfig;
}

interface DatabaseConfig {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
}

interface CorsConfig {
    origin: string | string[] | boolean;
    methods: string;
    allowedHeaders: string;
    credentials: boolean;
}

const config: Config = {
    // server settings
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // database settings
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        name: process.env.DB_DATABASE || 'ffp',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },

    // CORS settings
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: 'GET,POST,PUT,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true,
    },
};

export default config;