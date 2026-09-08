//contiene il database e accende il server
import 'dotenv/config'; //le variabili d'ambiente devono essere caricate prima che qualunque altro file provi a leggerle

import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

import cookieParser from 'cookie-parser';

import express from 'express'; //importo il framework che gestisce server, rotte, middlewae

import cors from 'cors'; //autorizzo il frontend a fare richieste a questo backend

import mongoose from 'mongoose'; //importo la libreria che ci fa comunicare con MongoDB

import authRoutes from './routes/authRoutes.js';

import userRoutes from './routes/userRoutes.js'; //importo le routes degli user

import ticketRoutes from './routes/ticketRoutes.js'; // Importo il router dei ticket definito nell'altro file

const app = express(); //creo l'applicazione. "app" è l'oggetto dove registrerò tutti i middleware e le rotte

// In locale usiamo 4000. Online la porta la sceglie Render e ce la comunica
// nella variabile PORT: se ignorassimo quel valore, Render busserebbe a una
// porta dove non c'è nessuno e il deploy fallirebbe.
const PORT = process.env.PORT || 4000;

// Autorizza le richieste che arrivano dall'indirizzo del frontend. Senza questo, il browser bloccherebbe le chiamate.
// credentials: true serve per i cookie del login.
app.use(
  cors({
    //quando si usano i cookie bisogna dichiarare esattamente da quale origine si accettano richieste
    //questo valore ce l'hai nel file .env
    // Il valore di riserva serve per lo sviluppo: se CLIENT_URL non è
    // impostata, vale localhost:5173. Online la impostiamo su Render
    // con l'indirizzo di Vercel.
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    // Questa riga autorizza il browser a mandare i cookie al server
    credentials: true, //autorizzo il browser a mandare i cookie, altrimenti il refreshToken non arriverà mai al server
  }),
);

// Se la richiesta porta con sé un corpo in formato JSON, lo trasforma in un oggetto JavaScript e lo mette in req.body.
app.use(express.json());

// stampo in console ogni cosa mi arriva in richiesta, cosi rimaniamo aggiornati di come interagiamo con il frontend e backend
// req = la richiesta, res = la risposta, next = la funzione
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Legge i cookie che arrivano e li mette in req.cookies.
// Senza questo, req.cookies non esisterebbe manco
app.use(cookieParser());

//ROTTE

// Non serve all'applicazione: serve a noi, per svegliare il server su Render
// e per controllare che sia partito senza dover fare il login.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Il backend è vivo!' });
});

// Collego il router: tutte le sue rotte partiranno o da "/api/tickets" o da "/api/users" o da "/api/auth"
// Il '/' definito dentro ticketRoutes.js diventa /api/tickets,
// il '/:id' diventa /api/tickets/:id, e così via.
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

//questi middleware dobbiamo metterli in fondo per ultimi perchè
//se li mettessimo all'inizio, non diamo tempo di poter vedere se la rotta richiesta c'è
//o se è scritta correttamente, quindi andrebbe direttamente in not found
// notFound risponde 404 a qualunque rotta non riconosciuta dalle righe sopra,
// errorHandler raccoglie tutti gli errori lanciati dalle rotte.
app.use(notFound);
app.use(errorHandler);

// AVVIO
// La funzione è async perché connettersi al database richiede del tempo, e con await possiamo aspettare che finisca
async function avvia() {
  try {
    // Mi collego a MongoDB prendendo l'indirizzo messo in .env (che ci siamo ricavati dalla piattaforma MongoDB)
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connesso');

    //aspetterò che il database risponda per procedere.
    // app.listen mette il server in ascolto sulla porta, e chiama la funzione passata quando è pronto.
    app.listen(PORT, () => {
      console.log('Server acceso sulla porta ' + PORT);
    });
  } catch (errore) {
    // Se la connessione fallisce, stampo il messagio d'errore su console
    console.log('Errore di connessione a MongoDB:', errore.message);
  }
}

//chiamo tutta questa funzione altrimenti non parte niente
avvia();
