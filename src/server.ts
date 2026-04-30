import app from './app.js';
import config from './config/config.js';
import connectDatabase from './config/database.js';

async function start() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();