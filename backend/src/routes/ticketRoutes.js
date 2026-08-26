//definiamo le 5 operazioni che possiamo chiedere al server riguardo i ticket

import express from 'express';

import Ticket from '../models/Ticket.js'; // Importo il model: mi serve per parlare col database.
// Un Router è un piccolo contenitore di rotte collegate al server. Serve a tenere separate le rotte
// dei ticket da quelle degli utenti, dei commenti, eccetera
//una rotta è l'abbinazione tra metodo HTTP (quindi GET o POST) e PERCORSO a cui il server o frontend fanno riferimento
const router = express.Router();

// GET /api/tickets  ->  viene richiesta la lista di tutti i ticket
// La funzione è async perché parlare col database richiede tempo, e dobbiamo aspettare con await.
router.get('/', async (req, res) => {
  try {
    // find() senza argomenti restituisce tutti i documenti.
    // sort({ createdAt: -1 }) li ordina per data di creazione crescente
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets); // res.json() manda la risposta convertita in JSON
  } catch (errore) {
    // Ci finiamo solo se il database non risponde 500 = errore del server, non colpa di chi ha chiesto.
    res.status(500).json({ message: errore.message });
  }
});

// GET /api/tickets/:id  ->  viene richiesto un ticket singolo
// I due punti in ':id' indicano che nel percorso ci sarà una parte variabile
//che è proprio il n ome del ticket specifico che voglio
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    // findById restituisce null se non trova niente

    //se ticket non c'è, faccio return altrimenti continuerebbesenza riscontro
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    res.json(ticket); //converto in formato JSON
  } catch (errore) {
    // Qui ci arriviamo se l'id non ha la forma di un ObjectId
    // (per esempio /api/tickets/pippo). 400 = richiesta sbagliata.
    res.status(400).json({ message: 'ID non valido' });
  }
});

// POST /api/tickets  ->  viene chiedo di creare un nuovo ticket
router.post('/', async (req, res) => {
  try {
    // req.body contiene il JSON mandato da chi fa la richiesta.
    // create() valida i dati secondo lo schema e li salva.
    const nuovoTicket = await Ticket.create(req.body);
    // 201 = creato. È il codice corretto dopo una POST che produce una nuova risorsa
    res.status(201).json(nuovoTicket);
  } catch (errore) {
    // Ci arriviamo se la validazione fallisce: manca il titolo, la priorità non è fra quelle ammesse, eccetera.
    // 400 perché la colpa è dei dati mandati.
    res.status(400).json({ message: errore.message });
  }
});

// PATCH /api/tickets/:id  ->  modifica un ticket esistente
// PATCH si usa per cambiare ALCUNI campi.
// (PUT invece sostituirebbe l'intero documento: a noi non serve perchè vogliamo modificare solo qualcosa di un ticket gia creato)
//per poterlo fare ovviamente ci serve l'id del ticket specifico
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, // quale documento
      req.body, // cosa cambiare
      {
        // new: true -> restituisci il documento DOPO la modifica, altrimenti senza riceverei la versione vecchia
        new: true,
        // runValidators: true -> applica anche durante le modifiche le regole dello schema.
        // Di default Mongoose le controlla solo alla creazione
        runValidators: true,
      },
    );
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    res.json(ticket);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// DELETE /api/tickets/:id  -> viene chiesto di eliminare un ticket specifico
//quindi anche qui serve l'id
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }

    res.json({ message: 'Ticket eliminato' }); //mando una conferma di avvenuta cancellazione
  } catch (errore) {
    res.status(400).json({ message: 'ID non valido' });
  }
});
// Esporto il router per poterlo collegare in server.js.
export default router;
