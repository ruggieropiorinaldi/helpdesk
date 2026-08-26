import express from 'express';
import User from '../models/User.js';
const router = express.Router();

// POST /api/users  -> se viene richiesto di creare un utente
router.post('/', async (req, res) => {
  try {
    const nuovoUtente = await User.create(req.body);
    res.status(201).json(nuovoUtente);
  } catch (errore) {
    // se si verifica errore di tipo "email gia presente" allora è un errore con codice 11000
    if (errore.code === 11000) {
      return res.status(409).json({ message: "Email gia' registrata" });
    }
    res.status(400).json({ message: errore.message });
  }
});

// GET /api/users  ->  viene richiesta la lista di tutti gli utenti
router.get('/', async (req, res) => {
  try {
    //ordino da "a" a "z"
    const utenti = await User.find().sort({ nome: 1 });
    res.json(utenti);
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});
export default router;
