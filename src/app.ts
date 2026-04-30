import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandlers.js';
import config from './config/config.js';

const app = express();

// security middlewares
app.use(helmet()); // set http security headers
app.use(cors(config.cors));

// logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true })); // parse form data

// mount all rountes under /api
app.use('/api', routes);

// global error handler
app.use(errorHandler);

export default app;