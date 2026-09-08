import express from 'express';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/authenticate.js';
import {
  creaAccessToken,
  creaRefreshToken,
  opzioniCookie,
  datiPubblici,
} from '../services/tokenService.js';
const router = express.Router();

//REGISTER
// POST /api/auth/register  -> viene chiesto di creare un account e quindi di registrarsi
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { nome, email, password } = req.body;

    // Controllo minimo prima di disturbare il database.
    // Il modello ha gia' i suoi required, ma cosi' il messaggio
    // che arriva al frontend e' chiaro e in italiano.
    if (!nome || !email || !password) {
      throw new ApiError(400, 'Nome, email e password sono obbligatori');
    }

    // Email gia' presa? Meglio accorgersene qui e rispondere 409
    // (= conflitto), invece di lasciar esplodere l'indice unique
    // dello schema con un errore che diventerebbe un 500.
    const esistente = await User.findOne({ email });
    if (esistente) {
      throw new ApiError(409, 'Questa email e gia registrata');
    }

    // Il ruolo NON lo prendiamo dal body: chi si registra e' sempre 'utente'
    // anche se dovesse mettere altro. Se lo leggessimo da req.body,
    // basterebbe mandare {"ruolo":"admin"} da Thunder Client per
    // diventare amministratore. Lo decide il server, punto.
    const utente = await User.create({
      nome,
      email,
      password,
      ruolo: 'utente',
    });

    // La password non la cifriamo qui: ci pensa il pre('save') del
    // modello User, cosi' la regola vive in un posto solo e vale
    // per qualunque strada crei un utente.

    // Creiamo il refresh token e lo mettiamo nel cookie
    const refresh = await creaRefreshToken(utente);
    res.cookie('refreshToken', refresh, opzioniCookie());
    // L'access token invece va nel corpo della risposta:
    // il frontend lo terra' in memoria.
    // Nota: rispondiamo come farebbe il login, quindi chi si registra
    // e' gia' dentro e non deve rifare l'accesso subito dopo.
    res.status(201).json({
      accessToken: creaAccessToken(utente),
      utente: datiPubblici(utente),
    });
  }),
);

//LOGIN
// POST /api/auth/login  ->  entra e ricevi i due token
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Controllo minimo: senza questi due campi: devono essere stati inseriti
    if (!email || !password) {
      throw new ApiError(400, 'Email e password sono obbligatorie');
    }

    // select('+password') e' l'UNICO punto del progetto dove
    // chiediamo la password: il + scavalca il select: false dello schema
    const utente = await User.findOne({ email }).select('+password'); //troviamo una email con quella password (nel caso siano corrette e che esista questa coppia)

    // Email che non esiste in database
    if (!utente) {
      throw new ApiError(401, 'Credenziali non valide');
    }

    // verificaPassword e' il metodo che abbiamo messo sullo schema: rifa' l'hash di quello che l'utente ha scrittoe lo confronta con quello salvato. Torna true o false.
    const passwordGiusta = await utente.verificaPassword(password);

    if (!passwordGiusta) {
      // Stesso messaggio del caso sopra: non diciamo quale
      // dei due e' sbagliato. Altrimenti si potrebbero provare
      // mille email per scoprire quali sono registrate
      throw new ApiError(401, 'Credenziali non valide');
    }

    //se arriviamo qui, allora le credenziali sono valide per effettuare il login

    // 1. REFRESH TOKEN: una stringa casuale, salvata a database, che va nel cookie. E' quello revocabile, dura 7 giorni.
    const refresh = await creaRefreshToken(utente);
    res.cookie('refreshToken', refresh, opzioniCookie());

    // 2. ACCESS TOKEN: un JWT da 15 minuti, che va nel corpo della risposta. Il frontend lo terra' in memoria e lo allegera' a ogni richiesta.
    res.json({
      accessToken: creaAccessToken(utente),
      utente: datiPubblici(utente),
    });
  }),
);

//REFRESH
// POST /api/auth/refresh  ->  rinnova l'ACCESS TOKEN (quello di 7gg) scaduto
// Il frontend la chiamera' da solo, senza che l'utente se ne accorga
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    // Il cookie e' arrivato da solo: il browser lo allega a ogni richiesta
    const tokenRicevuto = req.cookies.refreshToken;

    // Nessun cookie = nessuna sessione da rinnovare
    // Succede dopo un logout, o se il cookie e' scaduto ed e' stato cancellato dal browser
    if (!tokenRicevuto) {
      throw new ApiError(401, 'Sessione assente');
    }

    // Cerchiamo quella stringa nel registro delle sessioni.
    // populate('utente') sostituisce l'id dell'utente con l'utente vero
    const salvato = await RefreshToken.findOne({
      token: tokenRicevuto,
    }).populate('utente');

    // --- I TRE MODI DI FALLIRE ---
    // a chi sta provando a indovinare non regaliamo l'informazione su QUALE controllo e' fallito.

    // 1. Il token non esiste proprio: inventato, oppure gia' cancellato dall'indice TTL perche' scaduto da tempo
    if (!salvato) {
      throw new ApiError(401, 'Sessione non valida');
    }

    // 2. Il token esiste ma e' stato revocato. Due casi:
    //l'utente ha fatto logout,
    // oppure e' gia' stato usato per un refresh precedente
    if (salvato.revocatoIl) {
      throw new ApiError(401, 'Sessione non valida');
    }

    // 3. Il token e' scaduto: sono passati piu' di 7 giorni
    //    new Date() = "orario attuale": se la scadenza è un orario che sta prima, allora il tempo e' finito.
    if (salvato.scadeIl < new Date()) {
      throw new ApiError(401, 'Sessione non valida');
    }

    // MECCANISMO DI ROTAZIONE
    // Il token appena usato muore qui, subito, PRIMA di emettere quello nuovo. Ogni refresh token vale una volta sola.
    //
    // Serve a limitare i danni di un furto: se qualcuno ti ruba
    // il cookie ma tu nel frattempo hai gia' fatto un refresh, il suo token e' morto. E se lo usa lui per primo, il tuo smette di funzionare e tu te ne accorgi.
    salvato.revocatoIl = new Date();
    await salvato.save();

    // populate ha messo l'utente intero dentro salvato.utente.
    // Lo mettiamo in una variabile con un nome chiaro, cosi' le righe sotto si leggono come quelle del login
    const utente = salvato.utente;

    // --- LA COPPIA NUOVA ---
    // Da qui in poi e' identico al login: un refresh token nuovo nel cookie e un access token nuovo nel corpo della risposta
    const refresh = await creaRefreshToken(utente);
    res.cookie('refreshToken', refresh, opzioniCookie());

    res.json({
      accessToken: creaAccessToken(utente),
      utente: datiPubblici(utente),
    });
  }),
);

// POST /api/auth/logout  ->  chiude la sessione
//   1. spegne la sessione sul SERVER (revoca il refresh token)
//   2. toglie il cookie dal BROWSER
// Se facessi solo la seconda, il token resterebbe valido a
// database e chiunque ne avesse una copia potrebbe continuare
// a rinnovare l'accesso.
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    // Il cookie arriva da solo: il browser lo allega alla richiesta.
    const tokenRicevuto = req.cookies.refreshToken;

    // Se il cookie non c'e', saltiamo tutto questo blocco
    // Un logout deve riuscire comunque: chi ha gia' chiuso la
    // sessione (o non l'ha mai aperta) non deve ricevere un errore.
    if (tokenRicevuto) {
      // Cerchiamo quella sessione nel registro delle sessioni.
      const salvato = await RefreshToken.findOne({ token: tokenRicevuto });

      // Potrebbe non esserci: token inventato, o gia' cancellato dall'indice TTL perche' scaduto.
      //quindi se salvato=true allora abbiamo trovato refreshToken con tokenRicevuto quindi la sessione esiste e il token è ancora valido
      if (salvato) {
        // Ecco la revoca: mettere una data qui spegne la sessione.
        // Da adesso la rotta /refresh la rifiutera'.
        salvato.revocatoIl = new Date();
        await salvato.save();
      }
    }

    // Cancelliamo anche il cookie dal browser. Le opzioni devono essere le stesse con cui e' stato creato, altrimenti il browser non capisce quale cookie stai cancellando.
    res.clearCookie('refreshToken', opzioniCookie());

    res.json({ message: 'Disconnesso' });
  }),
);

// GET /api/auth/me  ->  "chi sono io?"
//quando ricarico la pagina, il frontend che aveva memorizzato i dati dell'utente + acces token vengono persi.
//il refresh token però no, perchè è stato salvato nel cookie, che a sua volta è stato salvato dal browser in memoria fisica fino alla sua data di scadenza
//quindi quando ricarico:
//il browser ha dimenticato chi sei => chiede al server => il server non ha memoria, manco lui lo sa => viene chiamata "/refresh" =>
// => guarda se c'è un cookie (nel nostro caso si) e ricrea un access token (15min) legato al refresh token (7gg) presente nel cookie => a quel punto chiamo "/me" =>
// => adesso dentro /me chiamo la funzione authenticate => prende dall'intestazione il nuovo access token (15min) legato al refresh token (7gg) e recupera i dati dell'utente associato
router.get(
  '/me',
  //authenticate gira per primo. Prende l'intestazione Authorization, ne estrae il token, verifica la firma, va a prendere l'utente dal database e lo attacca a req.user
  authenticate,
  asyncHandler(async (req, res) => {
    // Qui non serve nessuna query: l'utente e' gia' in mano.
    // Ci limitiamo a rispondere con i campi pubblici.
    res.json(datiPubblici(req.user));
  }),
);

export default router;
