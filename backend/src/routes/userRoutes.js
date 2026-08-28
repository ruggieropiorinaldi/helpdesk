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

    const utente = await User.findByIdAndUpdate(
      req.params.id, // prendo l'id dell'utente cui voglio modificare il ruolo
      { ruolo }, // cosa cambiare: solo questo campo
      {
        new: true, // restituisci l'utente DOPO la modifica
        runValidators: true, // ricontrollo che il nuovo ruolo rispetti lo schema (quindi sia un enum consentito)
      },
    );

    if (!utente) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.json(utente);
  } catch (errore) {
    // 400: ruolo non ammesso, oppure id malformato. Colpa della richiesta.
    res.status(400).json({ message: errore.message });
  }
});

export default router;
