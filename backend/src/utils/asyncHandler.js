export default function asyncHandler(fn) {
  return function (req, res, next) {
    // Promise.resolve() avvolge il risultato in una promise.
    // .catch(next) dice: se questa promise fallisce, prendi l'errore e passalo a next()
    //  next(qualcosa) in Express significa "salta tutto e vai dritto al gestore degli errori".
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
