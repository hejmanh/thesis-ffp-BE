import pg from 'pg';

const connectDatabase = async () => {
    // to do: pooling, error handling
    
    return new pg.Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_DATABASE || 'ffp',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    }).connect();
};

export default connectDatabase;