import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
function Barra() {
  const { utente, logout } = useAuth();
  // Se non c'e' nessuno collegato (siamo sul login) allora la barra non serve
  // Restituendo null non disegniamo proprio niente (quindi salto proprio questo continente)
  if (!utente) {
    return null;
  }
  return (
    <div className="barra">
      {/*
        Disegna comunque un <a> nella pagina, ma intercetta il click e cambia pagina senza ricaricare niente: 
        aggiorna l'indirizzo nella barra e React Router sostituisce solo il componente sullo schermo
        to="/tickets" è la destinazione. In un <a> si chiama href; qui si chiama to perché non è un indirizzo che il browser deve andare a chiedere,
         ma un percorso che React Router deve far combaciare con una delle sue <Route>.
      */}
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
