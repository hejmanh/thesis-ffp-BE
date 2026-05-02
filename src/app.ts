import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import routes from '@/routes/index.js';
import { notFoundHandler } from '@/middlewares/notFound.js';
import { errorHandler } from '@/middlewares/errorHandlers.js';
import config from '@/config/config.js';

const app = express();

// API documentation
const swaggerDocument = YAML.load('./src/docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// security middlewares
app.use(helmet()); // set http security headers
app.use(cors(config.cors));

// logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true })); // parse form data

// mount all routes under /api
app.use('/api', routes);

// global error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;