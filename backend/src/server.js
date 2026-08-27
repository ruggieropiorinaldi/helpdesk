//contiene il database e accende il server
import 'dotenv/config'; //le variabili d'ambiente devono essere caricate prima che qualunque altro file provi a leggerle

import express from 'express'; //importo il framework che gestisce server, rotte, middlewae

import cors from 'cors'; //autorizzo il frontend a fare richieste a questo backend

import mongoose from 'mongoose'; //importo la libreria che ci fa comunicare con MongoDB

import authRoutes from './routes/authRoutes.js';

import userRoutes from './routes/userRoutes.js'; //importo le routes degli user

import ticketRoutes from './routes/ticketRoutes.js'; // Importo il router dei ticket definito nell'altro file

const app = express(); //creo l'applicazione. "app" è l'oggetto dove registrerò tutti i middleware e le rotte

const PORT = process.env.PORT || 4000; //leggo la porta definita dentro al nostro file .env che contiene i dati d'accesso (se la porta non è definita accedo a 4000)

// Autorizza le richieste che arrivano dall'indirizzo del frontend. Senza questo, il browser bloccherebbe le chiamate.
// credentials: true serve per i cookie del login.
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Se la richiesta porta con sé un corpo in formato JSON, lo trasforma in un oggetto JavaScript e lo mette in req.body.
app.use(express.json());

// stampo in console ogni cosa mi arriva in richiesta, cosi rimaniamo aggiornati di come interagiamo con il frontend e backend
// req = la richiesta, res = la risposta, next = la funzione
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

//ROTTE

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Il backend è vivo!' });
});

// Collego il router: tutte le sue rotte partiranno o da "/api/tickets" o da "/api/users" o da "/api/auth"
// Il '/' definito dentro ticketRoutes.js diventa /api/tickets,
// il '/:id' diventa /api/tickets/:id, e così via.
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
// Questo middleware sta dopo tutte le rotte, quindi si arriva qiu solo se non si è trovata la rotta giusta corrispondente
app.use((req, res) => {
  res.status(404).json({ message: 'Rotta non trovata' });
});

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
      console.log('Server acceso su http://localhost:' + PORT);
    });
  } catch (errore) {
    // Se la connessione fallisce, stampo il messagio d'errore su console
    console.log('Errore di connessione a MongoDB:', errore.message);
  }
}

//chiamo tutta questa funzione altrimenti non parte niente
avvia();
