import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();
// sia durante fase di registrazione che di login viene generato e assegnato un token
function creaToken(utente) {
  return jwt.sign(
    { id: utente._id, ruolo: utente.ruolo }, //dentro al token metto solo dati non sensibili ma allo stesso tempo utili per identificare l'user
    process.env.JWT_SECRET, //contiene il segreto con cui sigillare il token
    { expiresIn: '1h' }, //il token dopo 1h scade da solo
  );
}

// POST /api/auth/register  -> viene chiesto di creare un account
router.post('/register', async (req, res) => {
  try {
    const { nome, email, password } = req.body;
    // Prendiamo dal body SOLO questi tre campi. Il ruolo no: altrimenti chiunque potrebbe registrarsi mandando "ruolo": "admin" e diventare amministratore da solo.
    // Chi si registra e' sempre 'utente'; i ruoli li assegna un admin, con una rotta a parte.
    const utente = await User.create({ nome, email, password });
    // L'hash e' gia' stato fatto dal pre('save'): qui non
    // dobbiamo cifrare niente.
    res.status(201).json({
      token: creaToken(utente),
      utente: {
        id: utente._id,
        nome: utente.nome,
        email: utente.email,
        ruolo: utente.ruolo,
      },
    });
  } catch (errore) {
    if (errore.code === 11000) {
      return res.status(409).json({ message: "Email gia' registrata" });
    }
    res.status(400).json({ message: errore.message });
  }
});

// POST /api/auth/login  ->  entra e ricevi il token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email e password sono obbligatorie' });
    }
    // select('+password') e' l'unico posto dove chiediamo la password.
    // Il + serve proprio a scavalcare il select: false dello schema.
    const utente = await User.findOne({ email }).select('+password');
    if (!utente) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }
    const passwordGiusta = await utente.verificaPassword(password);
    if (!passwordGiusta) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }
    res.json({
      token: creaToken(utente),
      utente: {
        id: utente._id,
        nome: utente.nome,
        email: utente.email,
        ruolo: utente.ruolo,
      },
    });
  } catch (errore) {
    res.status(500).json({ message: errore.message });
  }
});
export default router;
