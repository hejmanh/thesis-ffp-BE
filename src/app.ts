import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from '@/routes/index.js';
import { notFoundHandler } from '@/middlewares/notFound.js';
import { errorHandler } from '@/middlewares/errorHandlers.js';
import config from '@/config/config.js';
import { swaggerUiOptions } from '@/docs/swaggerOptions.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API documentation
const swaggerPath = path.resolve(__dirname, 'docs', 'swagger.yaml');
const swaggerDocument = YAML.parse(fs.readFileSync(swaggerPath, 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, undefined, swaggerUiOptions));

// security middlewares
app.use(helmet()); // set http security headers
app.use(cors(config.cors));

// logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(cookieParser());

// mount all routes under /api
app.use('/api/v1', routes);

// global error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;