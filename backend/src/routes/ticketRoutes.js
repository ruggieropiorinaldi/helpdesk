//definiamo le 5 operazioni che possiamo chiedere al server riguardo i ticket

import express from 'express';

import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

import { puoVedereIlTicket } from '../utils/permessi.js';

import Comment from '../models/Comment.js';

import Ticket from '../models/Ticket.js'; // Importo il model: mi serve per parlare col database.
// Un Router è un piccolo contenitore di rotte collegate al server. Serve a tenere separate le rotte
// dei ticket da quelle degli utenti, dei commenti, eccetera
//una rotta è l'abbinazione tra metodo HTTP (quindi GET o POST) e PERCORSO a cui il server o frontend fanno riferimento
const router = express.Router();

//applica questo middleware a tutte le rotte. questo perchè ripetere authenticate su ogni rotta è meglio ora,
//piuttosto che aggiungere una rotta in futuro e dimenticarci di authenticarla
//in questo modo ogni rotta adesso è creata per rispondere solo a un user con token valido
router.use(authenticate);

// GET /api/tickets  ->  viene richiesta la lista di tutti i ticket
// La funzione è async perché parlare col database richiede tempo, e dobbiamo aspettare con await.
router.get('/', async (req, res) => {
  try {
    // Costruiamo il filtro guardando CHI sta chiedendo.
    const filtro = {};
    if (req.user.ruolo === 'utente') {
      // vede solo i ticket che ha aperto lui
      filtro.creatoDa = req.user._id;
    } else if (req.user.ruolo === 'tecnico') {
      // vede solo quelli assegnati a lui
      filtro.assegnatoA = req.user._id;
    }
    // Se e' admin non aggiungiamo niente: filtro resta {}, e find({}) restituisce tutto.
    const tickets = await Ticket.find(filtro)
      .populate('creatoDa', 'nome email') //creatoDa contiene l'id di un user. la funzione "poplulate" prende i dati che scrivo dopo "nome email" direttamente dall'oggetto
      .populate('assegnatoA', 'nome email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});

//COME FUNZIONA POPULATE e perchè è meglio
//se mi viene richiesto di leggere dei ticket (quindi GET) mando una query per avere i ticket
//poi voglio sapere (di alcuni di questi o di tutti) chi li ha creati, e quindi i rispettivi utenti
//dovrei di nuovo fare una query per sapere ogni utente eccetera...tanto lavoro
//populate fa una prima query per avere tutti i ticket. Poi fa una seconda query
//per richiedere tutti insieme gli utenti che gli servono, cosi non fa tanti viaggi ed è piu efficiente

// GET /api/tickets/:id  ->  viene richiesto un ticket singolo
// I due punti in ':id' indicano che nel percorso ci sarà una parte variabile
//che è proprio il n ome del ticket specifico che voglio
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('creatoDa', 'nome email')
      .populate('assegnatoA', 'nome email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    //richiamo la funzione da "permessi" e controllo se quello user può visualizzare quel ticket
    if (!puoVedereIlTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Permesso negato' });
    }
    res.json(ticket);
  } catch (errore) {
    res.status(400).json({ message: 'ID non valido' });
  }
});

// POST /api/tickets  ->  viene chiedo di creare un nuovo ticket
router.post('/', authorize('utente'), async (req, res) => {
  try {
    const { titolo, descrizione, categoria, priorita } = req.body;
    const nuovoTicket = await Ticket.create({
      titolo,
      descrizione,
      categoria,
      priorita,
      creatoDa: req.user._id, //il ruolo non lo impostiamo piu noi, lo prendiamo direttamente dal token
    });
    res.status(201).json(nuovoTicket);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// PATCH: modifica. Il proprietario puo' correggere il suo ticket,
// l'admin puo' intervenire su tutti (gli serve per assegnarli).
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id); //prima controllo che il ticket esista
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    //devo controllare se chi vuole visualizzarlo è il proprietario del ticket (ovvero chi lha aperto)
    //quindi eProprietario restituisce true o false
    const eProprietario =
      req.user.ruolo === 'utente' &&
      ticket.creatoDa.toString() === req.user._id.toString();
    //se lo user che vuole visualizzare non è ticket (quindi non puo vedere tutto)
    //e se non è neanche il proprietario di chi ha aperto quel ticket,
    //allora non puo vederlo
    if (req.user.ruolo !== 'admin' && !eProprietario) {
      return res.status(403).json({ message: 'Permesso negato' });
    }
    //se arrivo fin qui allora ho il permesso per modificare il ticket
    const aggiornato = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //fa restituire la versione aggiornata anziche quella vecchia
      runValidators: true, //attivo comunque i controlli di schema anche in fase di modifica
    });
    res.json(aggiornato); //restituisco il ticket modificato
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: solo l'amministratore. Qui basta authorize,
// non serve nessun controllo aggiuntivo.
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    res.json({ message: 'Ticket eliminato' });
  } catch (errore) {
    res.status(400).json({ message: 'ID non valido' });
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

//aggiungo le ROUTES che partono dai ticket

// GET /api/tickets/:id/commenti  ->  legge i commenti di un ticket
router.get('/:id/commenti', async (req, res) => {
  try {
    // 1. il ticket esiste?
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }

    // 2. chi sta chiedendo ha il diritto di vedere QUESTO ticket?
    if (!puoVedereIlTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Permesso negato' });
    }

    // 3. prendo tutti i commenti che appartengono a questo ticket,
    //    di chiunque li abbia scritti
    const commenti = await Comment.find({ ticket: req.params.id })
      // sostituisco l'id dell'autore con nome e ruolo, per poterli mostrare
      .populate('autore', 'nome ruolo')
      // dal più vecchio al più recente: si legge come una conversazione
      .sort({ createdAt: 1 });

    res.json(commenti);
  } catch (errore) {
    res.status(400).json({ message: 'ID non valido' });
  }
});

// POST /api/tickets/:id/commenti  ->  aggiunge un commento a un ticket
router.post('/:id/commenti', async (req, res) => {
  try {
    // 1. il ticket esiste?
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }

    // 2. chi sta scrivendo ha il diritto di scrivere?
    if (!puoVedereIlTicket(req.user, ticket)) {
      return res.status(403).json({ message: 'Permesso negato' });
    }

    // 3. costruisco il commento campo per campo, e ogni campo viene
    //    da una fonte diversa e ben precisa:
    const nuovoCommento = await Comment.create({
      // dall'URL: il ticket lo decide l'indirizzo, non chi chiama
      ticket: req.params.id,

      // dal token: l'autore lo sa il server, il client non può mentire
      autore: req.user._id,

      // dal body: l'unica cosa che il client ha davvero il diritto di scegliere
      testo: req.body.testo,
    });

    // 201 = creato. È il codice giusto dopo una POST che produce
    res.status(201).json(nuovoCommento);
  } catch (errore) {
    // Ci finiamo se la validazione fallisce (per esempio testo mancante) o se l'id non ha la forma di un ObjectId.
    res.status(400).json({ message: errore.message });
  }
});

// Esporto il router per poterlo collegare in server.js.
export default router;
