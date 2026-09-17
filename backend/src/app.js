import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.routes.js';
import { FRONTEND_URL } from './config/configEnv.js';
import { errorHandler } from './middlewares/handleGlobalError.middleware.js';

const app = express();

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
  res.send('The NES Events API is active');
});

app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
  });
});

app.use(errorHandler);

export default app;