import ApiError from '../utils/ApiError.js';
//Se l'esecuzione arriva fin qui, vuol dire che nessuna rotta
// ha risposto — quindi l'indirizzo chiesto non esiste.
export default function notFound(req, res, next) {
  next(
    new ApiError(404, `Rotta non trovata: ${req.method} ${req.originalUrl}`),
  );
}
