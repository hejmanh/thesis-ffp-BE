import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    cors: CorsConfig;
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

    // CORS settings
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: 'GET,POST,PUT,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true,
    },
};

export default config;