import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import conversationsRouter from './routes/conversations.js';
import findingsRouter from './routes/findings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/conversations', conversationsRouter);
app.use('/api/findings', findingsRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
