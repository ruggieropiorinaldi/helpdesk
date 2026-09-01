import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
// Quanto dura il refresh token, in millisecondi.
// 7 giorni x 24 ore x 60 minuti x 60 secondi x 1000.
// Lo scriviamo una volta sola: serve sia per il database sia per il cookie, e devono essere d'accordo.
const DURATA_REFRESH = 7 * 24 * 60 * 60 * 1000;

// 1. ACCESS TOKEN: un JWT da 15 minuti
export function creaAccessToken(utente) {
  return jwt.sign(
    { id: utente._id, ruolo: utente.ruolo },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );
}

// 2. REFRESH TOKEN:  non e' un JWT, ma e' solo una lunga stringa casuale
//  Lo salviamo a database e lo restituiamo.
export async function creaRefreshToken(utente) {
  // 64 byte casuali scritti in esadecimale = 128 caratteri impossibili da indovinare.
  const token = crypto.randomBytes(64).toString('hex');
  // Date.now() e' il momento attuale in millisecondi.
  // Sommandoci la durata otteniamo il momento della scadenza.
  const scadeIl = new Date(Date.now() + DURATA_REFRESH);
  await RefreshToken.create({
    token,
    utente: utente._id,
    scadeIl,
  });
  return token;
}

// 3. Le opzioni del cookie
// le mettiamo qui cosi' sono identiche in tutti i posti dove serve, senza copiarle.
export function opzioniCookie() {
  return {
    // JavaScript non lo puo' leggere
    httpOnly: true, //è molto importante perchè
    //nei cookie ci saranno informazioni legate ai token, ad esempio dell'admin,
    //quindi se qualunque pagina potesse accederci, potrebbero poi fare quello che vogliono con quel token
    //invece con httpOnly:true solo il server può leggere

    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',

    maxAge: DURATA_REFRESH,
  };
}

//dati dell'utente da mandare al client
export function datiPubblici(utente) {
  return {
    id: utente._id,
    nome: utente.nome,
    email: utente.email,
    ruolo: utente.ruolo,
  };
}
