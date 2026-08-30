// QUATTRO PARAMETRI, non tre. Express distingue i gestori di errori dai middleware normali CONTANDO i parametri della
// funzione: con tre lo registra come middleware qualunque e non lo chiamerà mai per un errore

// 'next' qui non lo usiamo mai. Deve stare lì lo stesso,
// altrimenti i parametri diventano tre e tutto smette di
// funzionare senza nessun messaggio d'errore.
export default function errorHandler(err, req, res, next) {
  // se err.statusCode non esiste, usa 500.
  // Gli ApiError che lanciamo noi ce l'hanno
  // gli errori che arrivano da Mongoose o da un bug nostro no, e per quelli mettiamo 500
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Mongoose non sa niente di HTTP: lancia i suoi errori con i suoi nomi
  // Sta a noi decidere che 404 vuol dire una cosa e 400 un'altra.
  //  Questi tre blocchi sono quel dizionario, e stanno scritti QUI e in nessun altro posto del progetto.

  // CastError -> Mongoose non è riuscito a convertire un valore nel tipo dichiarato dallo schema
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identificatore non valido';
  }

  // ValidationError -> una regola dello schema non è rispettata:
  // campo required mancante, enum non ammesso, minlength troppo corta
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // code 11000 -> non è un errore di Mongoose ma di MongoDB:
  // "duplicate key". Succede quando violi un indice unique,
  // cioè quando qualcuno si registra con un'email già presente.
  if (err.code === 11000) {
    statusCode = 409;
    message = "Valore gia' esistente";
  }

  // Se dopo tutti i controlli siamo ancora a 500, vuol dire che
  // è un errore che non abbiamo previsto: un bug nostro, o il
  // database irraggiungibile. Quello lo vogliamo vedere per
  // intero nel terminale, con lo stack trace.
  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
}
