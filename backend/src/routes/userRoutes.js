import express from 'express';
import User from '../models/User.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = express.Router();

router.use(authenticate); //controlla se sei loggato correttamente (riempie req.user)
router.use(authorize('admin')); //controlla che sei autorizzato (controllo se req.user sia admin)

// GET /api/users  ->  voglio visualizzare la lista di tutti gli utenti
router.get('/', async (req, res) => {
  try {
    // find() senza filtro = tutti
    // sort({ nome: 1 }) ordina dalla A alla Z
    // le password non compaiono: ci pensa il select: false dello schema
    const utenti = await User.find().sort({ nome: 1 });
    res.json(utenti);
  } catch (errore) {
    // 500 perché qui l'unica cosa che può andare storta è il database
    res.status(500).json({ message: errore.message });
  }
});

// GET /api/users/tecnici  ->  voglio visualizzare la lista dei tecnici
router.get('/tecnici', async (req, res) => {
  try {
    const tecnici = await User.find({ ruolo: 'tecnico' }).sort({ nome: 1 });
    res.json(tecnici);
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});

// PATCH /api/users/:id/ruolo  ->  promuove o declassa un utente
router.patch('/:id/ruolo', async (req, res) => {
  try {
    // Estraggo dal body SOLO il campo ruolo e ignoro tutto il resto
    const ruolo = req.body.ruolo;

    // 1. Il ruolo richiesto e' uno dei due che questa pagina puo' assegnare?
    //    'admin' NON e' in questa lista di proposito: nuovi amministratori
    //    non si creano dall'interfaccia. Il primo (e unico) admin l'ho
    //    creato a mano nel database, ed e' una scelta consapevole.
    if (ruolo !== 'utente' && ruolo !== 'tecnico') {
      return res.status(400).json({ message: 'Ruolo non ammesso' });
    }

    // 2. L'utente da modificare esiste?
    const utente = await User.findById(req.params.id);
    if (!utente) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // 3. Non tocco gli altri amministratori: due admin non devono
    //    potersi declassare a vicenda, e non voglio rischiare di
    //    restare con zero admin nel sistema.
    if (utente.ruolo === 'admin') {
      return res
        .status(403)
        .json({ message: 'Non si puo cambiare il ruolo di un amministratore' });
    }

    // 4. E soprattutto non tocco me stesso: se mi togliessi il ruolo
    //    admin resterei chiuso fuori dalla mia stessa pagina.
    //    (req.user ce l'ha messo authenticate)
    if (utente._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'Non puoi cambiare il tuo stesso ruolo' });
    }

    // Superati i controlli, la modifica vera e' una riga sola.
    const aggiornato = await User.findByIdAndUpdate(
      req.params.id, // prendo l'id dell'utente cui voglio modificare il ruolo
      { ruolo }, // cosa cambiare: solo questo campo
      {
        new: true, // restituisci l'utente DOPO la modifica
        runValidators: true, // ricontrollo che il nuovo ruolo rispetti lo schema (quindi sia un enum consentito)
      },
    );

    res.json(aggiornato);
  } catch (errore) {
    // 400: id malformato, oppure schema non rispettato. Colpa della richiesta.
    res.status(400).json({ message: errore.message });
  }
});

export default router;
