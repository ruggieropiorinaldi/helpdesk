import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
function Barra() {
  const { utente, logout } = useAuth();
  // Se non c'e' nessuno collegato (siamo sul login) la barra non
  // serve. Restituendo null non disegniamo proprio niente:
  // e' il modo di React per dire "salta questo componente".
  if (!utente) {
    return null;
  }
  return (
    <div className="barra">
      <Link to="/tickets" className="titolo">
        HelpDesk
      </Link>
      <span className="utente">
        {utente.nome} ({utente.ruolo}){' '}
        {/* onClick={logout} passa la FUNZIONE, non la chiama.
            Con logout() partirebbe subito al primo disegno
            e verresti buttato fuori da solo. */}
        <button onClick={logout}>Esci</button>
      </span>
    </div>
  );
}
export default Barra;
