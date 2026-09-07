import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Tickets() {
  // Leggiamo dalla lavagna quello che ci serve.
  // apiAuth arriva dal Context: sa gia' quale token usare
  // e sa rinnovarlo da solo se scade. Per questo non importiamo
  // piu' niente da richiesta.js.
  // "logout" non serve piu' qui: adesso il bottone Esci sta nella Barra.
  // "utente" invece serve ancora, per decidere se mostrare il link
  // al nuovo ticket.
  const { utente, accessToken, apiAuth } = useAuth();

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
    // allora mostro all'utente che sto caricando ancora.
    // "tenue" e' la classe del CSS che lo scrive in grigio piccolo.
    return <p className="tenue">Caricamento...</p>;
  }

  return (
    <div>
      <h1>I tuoi ticket</h1>

      {/* Il link compare SOLO per il ruolo 'utente', perche' la rotta
          POST /api/tickets nel backend ha authorize('utente').
          Mostrarlo a un admin lo porterebbe dritto su un 403.
          E' comodita', non sicurezza: quella la fa il backend. */}
      {utente.ruolo === 'utente' && (
        <p>
          <Link to="/tickets/nuovo">Apri un nuovo ticket</Link>
        </p>
      )}

      {/* mostro il riquadro rosso solo se errore non e' vuoto.
          Prima lo stile stava scritto a mano nel tag (style inline):
          adesso e' una classe del foglio di stile, cosi' tutti i
          messaggi di errore del progetto sono uguali. */}
      {errore && <p className="errore">{errore}</p>}

      {/* se l'array e' vuoto lo dico, altrimenti la pagina
          sembrerebbe rotta */}
      {tickets.length === 0 && (
        <p className="tenue">Nessun ticket da mostrare.</p>
      )}

      {/* className="lista" toglie i pallini e trasforma ogni <li>
          in una scheda bianca col bordo arrotondato. */}
      <ul className="lista">
        {/* .map() trasforma OGNI ticket in un <li>.
            Dieci ticket in entrata, dieci righe in uscita.
            La key serve a React per capire quali righe sono
            cambiate: l'_id di MongoDB e' unico, perfetto. */}
        {tickets.map((ticket) => (
          <li key={ticket._id}>
            {/* Link e' il collegamento di React Router: cambia pagina
                senza ricaricare niente. Un <a> normale invece
                ricaricherebbe tutto e perderesti la sessione.
                Il grassetto non lo metto piu' col tag <strong>:
                lo fa il CSS con la regola .lista a */}
            <Link to={'/tickets/' + ticket._id}>{ticket.titolo}</Link>

            <div className="tenue">
              {/* Due classi separate da uno spazio: la prima da' la
                  forma (pillola, maiuscolo, testo bianco), la seconda
                  solo il colore. La seconda la costruisco attaccando
                  lo stato del ticket: stato-aperto, stato-risolto...
                  Cosi' il colore cambia da solo quando cambia lo stato. */}
              <span className={'stato stato-' + ticket.stato}>
                {ticket.stato}
              </span>{' '}
              priorita' {ticket.priorita}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Tickets;
