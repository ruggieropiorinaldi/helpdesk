//questo file costruisce l'applicazione, ma non la avvia
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
const app = express();
// --- middleware globali --
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
// --- rotta di prova --
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Il backend è vivo!' });
});
// --- rotta non trovata --
app.use((req, res) => {
  res.status(404).json({ message: `Rotta non trovata: ${req.originalUrl}` });
});
// --- gestione centralizzata degli errori (quattro parametri!) --
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Errore interno' });
});
export default app;
