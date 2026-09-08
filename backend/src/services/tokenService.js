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
  // Online il FRONTEND sta su vercel.app
  // il BACKEND su onrender.com
  //  Il cookie deve viaggiare fra due siti, e per farlo il browser pretende ("sameSite:none" e poi "secure:true")

  //sul mio computer la variabile NODE_ENV si trova nel file .env e contiene la parola development
  //il codice vuole capire dove sta girando se sul portatile o su Render
  //allora il codice fa il confronto NODE_ENV===production, vede che "developement" e non "production"
  //e allora inProduzione risulta falsa quindi "sameSite:lax", quello che mi serve quando sono in locale
  //perchè sia frontend che backend sono in localhost
  //su Render la variabile NODE_ENV la creo io e la imposto come "production" quindi sameSite:none
  const inProduzione = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // il JavaScript della pagina non lo vede
    // secure: il cookie viaggia solo su HTTPS
    secure: inProduzione,

    //di norma (con "lax") il browser allega il cookie solo alle richieste dirette allo stesso sito che lha creato
    //con "none" diciamo "manda il cookie anche verso siti diversi"
    sameSite: inProduzione ? 'none' : 'lax',
    //in locale con "lax" il cookie parte solo verso lo stesso sito che l'ha creato, quindi
    //nel nostro caso frontend e backend sono entrambi "localhost" quindi verrebbero inviati/ricevuti
    //online però abbiamo BACKEND (onrender.com) e FRONTEND (vercel.app)
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
