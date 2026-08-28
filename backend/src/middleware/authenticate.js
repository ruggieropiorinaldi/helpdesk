import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authenticate(req, res, next) {
  try {
    // Il token viaggia in un'intestazione HTTP chiamata Authorization,
    // nella forma:   Authorization: Bearer eyJhbGciOi... dove "bearer" è lo standard che indica che chi possiede questo token è autorizzato, senza bisogno di altre credenziali
    const intestazione = req.headers.authorization;
    if (!intestazione || !intestazione.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token mancante' });
    }
    // split(' ') taglia la stringa dove trova lo "spazio" e restituisce un array di due pezzi: ['Bearer', 'eyJhbGciOi...'].
    // A noi serve il secondo, quindi quello che sta in posizione indice=1
    const token = intestazione.split(' ')[1];
    // verify fa due cose insieme: ricalcola la firma e controlla che corrisponda, e verifica che il token non sia scaduto.
    // Se qualcosa non torna, LANCIA un errore: finiamo nel catch.
    // Se tutto e' a posto, restituisce il payload.
    const contenuto = jwt.verify(token, process.env.JWT_SECRET);
    //se il token è valido, allora il server vuole recuperare le informazioni di quell'utente
    //poichè sappiamo che nella firma c'è l'id e ruolo, allora prendiamo dal contenuto del token l'id e cerchiamo tra tutti gli user, quello con quell'id
    //potremmo prendere il ruolo direttamente dal token, ma non sappiamo se nel corso del tempo sia stato modificato il ruolo
    //quindi per evitare richiamate future, preferisco accertarmi adesso e cercare adesso quell'user
    const utente = await User.findById(contenuto.id);
    if (!utente) {
      return res.status(401).json({ message: "Utente non piu' esistente" });
    }
    // Ecco il passaggio chiave: attacchiamo l'utente alla richiesta.
    // Da qui in avanti, OGNI funzione della catena trovera' req.user già pronto
    req.user = utente;
    next();
  } catch (errore) {
    if (errore.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token scaduto, rifai il login' });
    }
    return res.status(401).json({ message: 'Token non valido' });
  }
}
