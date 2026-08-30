// "extends Error" significa: parti da Error (l'errore standard di JavaScript) e aggiungici qualcosa
// Ereditiamo tutto quello che Error sa gia' fare, e ci attacchiamo un campo in piu'.
export default class ApiError extends Error {
  constructor(statusCode, message) {
    // super() chiama il costruttore di Error, quello da cui ereditiamo
    // srve per impostare il messaggio nel modo giusto
    super(message);
    // Questo e' l'unico pezzo nuovo: il codice HTTP viaggia attaccato all'errore.
    this.statusCode = statusCode;
  }
}
