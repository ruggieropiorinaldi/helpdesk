import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Tickets() {
  // Leggiamo dalla lavagna quello che ci serve.
  // apiAuth arriva dal Context: sa gia' quale token usare
  // e sa rinnovarlo da solo se scade. Per questo non importiamo
  // piu' niente da richiesta.js.
  const { utente, accessToken, logout, apiAuth } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);

  //****CHIAMO BACKEND  */
  useEffect(() => {
    // useEffect non vuole una funzione async, quindi ne
    // dichiariamo una dentro e poi la chiamiamo.
    async function carica() {
      try {
        // chiamo il backend e prendo i ticket, che finiscono in "dati".
        // Non passo il token: ce l'ha gia' apiAuth. E se e' scaduto,
        // lui chiama /auth/refresh e ritenta senza che io faccia niente.
        const dati = await apiAuth('/tickets');
        setTickets(dati); // React ridisegna e fa vedere i ticket
      } catch (err) {
        // Ci arrivo se il backend ha risposto male (403, 500...)
        // oppure se nemmeno il refresh e' riuscito: in quel caso
        // il messaggio e' "Sessione scaduta, rifai il login".
        setErrore(err.message);
      } finally {
        // finally gira sempre, sia che vada bene sia che vada male:
        // in tutti e due i casi il caricamento e' finito.
        setCaricamento(false);
      }
    }

    carica();
  }, [accessToken]); //**** CON ACCESS TOKEN */

  if (caricamento) {
    // se caricamento=true, allora sto ancora aspettando
    // allora mostro all'utente che sto caricando ancora
    return <p>Caricamento...</p>;
  }

  return (
    <div>
      <h1>I tuoi ticket</h1>

      <p>
        Ciao {utente.nome} ({utente.ruolo}){' '}
        {/* onClick={logout} passa la FUNZIONE, non la chiama.
            Con logout() partirebbe subito al primo disegno
            e verresti buttato fuori da solo. */}
        <button onClick={logout}>Esci</button>
      </p>

      {/* Link e' il collegamento di React Router: cambia pagina
          senza ricaricare niente. Un <a> normale invece
          ricaricherebbe tutto e perderesti la sessione. */}
      {/* Il link compare SOLO per il ruolo 'utente', perche' la rotta
          POST /api/tickets nel backend ha authorize('utente').
          Mostrarlo a un admin lo porterebbe dritto su un 403.
          E' comodita', non sicurezza: quella la fa il backend. */}
      {utente.ruolo === 'utente' && (
        <p>
          <Link to="/tickets/nuovo">Apri un nuovo ticket</Link>
        </p>
      )}

      {/* mostro il paragrafo rosso solo se errore non e' vuoto */}
      {errore && <p style={{ color: 'red' }}>{errore}</p>}

      {/* se l'array e' vuoto lo dico, altrimenti la pagina
          sembrerebbe rotta */}
      {tickets.length === 0 && <p>Nessun ticket da mostrare.</p>}

      <ul>
        {/* .map() trasforma OGNI ticket in un <li>.
            Dieci ticket in entrata, dieci righe in uscita.
            La key serve a React per capire quali righe sono
            cambiate: l'_id di MongoDB e' unico, perfetto. */}
        {tickets.map((ticket) => (
          <li key={ticket._id}>
            <strong>
              <Link to={'/tickets/' + ticket._id}>{ticket.titolo}</Link>
            </strong>
            {' — '}
            {ticket.stato}
            {" — priorita' "}
            {ticket.priorita}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tickets;
