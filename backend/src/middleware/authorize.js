//   authorize('admin')             -> ruoliAmmessi = ['admin']
//   authorize('tecnico', 'admin')  -> ruoliAmmessi = ['tecnico','admin']
export default function authorize(...ruoliAmmessi) {
  //se arriviamo in questo file, vuol dire che la procedura di autenticazione è andata a buon fine
  //quindi ci ritroviamo ilf ile req.user
  return function (req, res, next) {
    if (!ruoliAmmessi.includes(req.user.ruolo)) {
      return res.status(403).json({ message: 'Permesso negato' });
    }
    next();
  };
}

//quando andrò a chiamare questa funzione, avrò ad esempio:
//voglio assegnare un ticket a un tecnico, quindi questa operazione di assegnazione è autorizzato solo admin a farla
//quindi farò operazione.authorize('admin')...
//e vedrò: l'utente che sta facendo quest'operazione, ha lo stesso ruolo che quell'operazione richiede?
