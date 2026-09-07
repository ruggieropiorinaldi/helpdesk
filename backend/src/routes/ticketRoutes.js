//definiamo le operazioni che possiamo chiedere al server riguardo i ticket

import express from 'express';

import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js'; // <-- minuscolo

import { transizioneAmmessa } from '../utils/ticketStateMachine.js';
import User from '../models/User.js';

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
      .populate('creatoDa', 'nome email') //creatoDa contiene l'id di un user. la funzione "populate" prende i dati che scrivo dopo "nome email" direttamente dall'oggetto
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
//che è proprio il nome del ticket specifico che voglio
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
      .populate('creatoDa', 'nome email')
      .populate('assegnatoA', 'nome email');
    if (!ticket) {
      //controllo prima se il ticket esista
      throw new ApiError(404, 'Ticket non trovato');
    }
    //se ticket esiste, controllo che l'user abbia l'autorizzazione per leggerlo
    if (!puoVedereIlTicket(req.user, ticket)) {
      throw new ApiError(403, 'Permesso negato');
    }
    res.json(ticket);
  }),
);

// POST /api/tickets  ->  viene chiesto di creare un nuovo ticket
router.post('/', authorize('utente'), async (req, res) => {
  try {
    const { titolo, descrizione, categoria, priorita } = req.body;
    const nuovoTicket = await Ticket.create({
      titolo,
      descrizione,
      categoria,
      priorita,
      creatoDa: req.user._id, //il proprietario non lo impostiamo piu noi, lo prendiamo direttamente dal token
    });
    res.status(201).json(nuovoTicket);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

/// PATCH /api/tickets/:id
// Modifica i dati descrittivi di un ticket: titolo, descrizione,
// categoria, priorita'. Lo stato e l'assegnazione NO: per quelli
// ci sono le rotte dedicate, con le loro regole.
router.patch('/:id', async (req, res) => {
  try {
    // controllo che ticket esiste
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }

    // chi vuole modificare un ticket, è l'user utente che lo ha aperto?
    const eProprietario =
      req.user.ruolo === 'utente' &&
      ticket.creatoDa.toString() === req.user._id.toString();

    //se non è ne admin, ne il proprietario di quel ticket, allora non si puo modificare
    if (req.user.ruolo !== 'admin' && !eProprietario) {
      return res.status(403).json({ message: 'Permesso negato' });
    }

    // Prendiamo dal body SOLO questi quattro campi.
    // Se arriva anche "stato" o "assegnatoA", viene ignorato.
    const { titolo, descrizione, categoria, priorita } = req.body;

    const aggiornato = await Ticket.findByIdAndUpdate(
      req.params.id,
      { titolo, descrizione, categoria, priorita },
      {
        new: true, // ridammi la versione DOPO la modifica
        runValidators: true, // ricontrolla le regole dello schema
      },
    );

    res.json(aggiornato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// DELETE /api/tickets/:id  ->  eliminare un ticket. Solo l'amministratore:
// qui basta authorize, non serve nessun controllo aggiuntivo.
router.delete('/:id', authorize('admin'), async (req, res) => {
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

    // 201 = creato. È il codice giusto dopo una POST che produce una risorsa
    res.status(201).json(nuovoCommento);
  } catch (errore) {
    // Ci finiamo se la validazione fallisce (per esempio testo mancante) o se l'id non ha la forma di un ObjectId.
    res.status(400).json({ message: errore.message });
  }
});

//l'assegnazione di un ticket specifico ad un tecnico specifico può essere fatta solo da un admin
router.patch(
  '/:id/assegna',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { tecnicoId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket non trovato');
    }
    // Controlliamo che l'id passato sia davvero di un tecnico
    const tecnico = await User.findById(tecnicoId);
    if (!tecnico || tecnico.ruolo !== 'tecnico') {
      throw new ApiError(400, "Il destinatario non e' un tecnico");
    }
    ticket.assegnatoA = tecnico._id;
    // Alla prima assegnazione il ticket passa da aperto ad assegnato.
    // Se era gia' in lavorazione (riassegnazione a un altro tecnico)
    // lasciamo lo stato dov'e'.
    if (ticket.stato === 'aperto') {
      ticket.stato = 'assegnato';
    }
    await ticket.save();
    res.json(ticket);
  }),
);

// Cambiare lo stato di un ticket. Possono farlo l'admin, il tecnico
// assegnato, e l'utente proprietario ma solo per riaprire.
router.patch(
  '/:id/stato',
  asyncHandler(async (req, res) => {
    const { stato } = req.body;

    const ticket = await Ticket.findById(req.params.id); //controllo se il ticket esiste
    if (!ticket) {
      throw new ApiError(404, 'Ticket non trovato');
    }

    // --- Chi puo' toccare lo stato di questo ticket? ---

    const eAdmin = req.user.ruolo === 'admin'; //controllo che chi vuole modificare lo stato sia un admin

    const eIlTecnicoAssegnato = //oppure che sia un tecnico E che quel ticket sia assegnato proprio a lui
      req.user.ruolo === 'tecnico' &&
      ticket.assegnatoA?.toString() === req.user._id.toString();

    // L'utente ha un solo potere: riaprire un ticket suo che
    // gli hanno dichiarato risolto ma che risolto non e'.
    const staRiaprendo =
      req.user.ruolo === 'utente' && //controllo che sia un utente normale
      ticket.creatoDa.toString() === req.user._id.toString() && //e che quel ticket lo abbia aperto lui
      ticket.stato === 'risolto' && //che lo stato attuale sia risolto
      stato === 'in_lavorazione'; //e che lo voglia riportare in lavorazione

    if (!eAdmin && !eIlTecnicoAssegnato && !staRiaprendo) {
      throw new ApiError(403, 'Permesso negato'); //nessuno dei tre casi: fuori
    }

    // --- La chiusura e' un caso a parte ---
    // Il tecnico puo' arrivare fino a 'risolto': dichiara di aver
    // finito il lavoro. Ma chiudere definitivamente la pratica
    // spetta al responsabile del servizio, che verifica e archivia.
    if (stato === 'chiuso' && !eAdmin) {
      throw new ApiError(403, 'Solo un amministratore puo chiudere un ticket');
    }

    // --- Il passaggio richiesto e' sensato? ---
    // Qui non conta piu' chi sei: conta solo se la mossa esiste
    // sul tabellone degli stati.
    if (!transizioneAmmessa(ticket.stato, stato)) {
      throw new ApiError(
        400,
        `Passaggio non ammesso: da "${ticket.stato}" a "${stato}"`,
      );
    }

    ticket.stato = stato;

    // Registriamo quando e' stato chiuso: servira' per le statistiche
    if (stato === 'chiuso') {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    res.json(ticket);
  }),
);

// Esporto il router per poterlo collegare in server.js.
export default router;
