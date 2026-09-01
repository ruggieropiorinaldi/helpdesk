import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiFetch } from '../api/apiFetch.js';
function Tickets() {
  // Leggiamo dalla lavagna quello che ci serve.
  const { utente, accessToken, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);
  useEffect(() => {
    // useEffect non vuole una funzione async, quindi ne
    // dichiariamo una dentro e poi la chiamiamo.
    async function carica() {
      try {
        const dati = await apiFetch('/tickets', accessToken);
        setTickets(dati);
      } catch (err) {
        setErrore(err.message);
      } finally {
        // finally gira sempre, sia che vada bene sia che vada male:
        // in tutti e due i casi il caricamento e' finito.
        setCaricamento(false);
      }
    }
    carica();
  }, [accessToken]);
  if (caricamento) {
    return <p>Caricamento...</p>;
  }
  return (
    <div>
      <h1>I tuoi ticket</h1>
      <p>
        Ciao {utente.nome} ({utente.ruolo}){' '}
        <button onClick={logout}>Esci</button>
      </p>
      {errore && <p style={{ color: 'red' }}>{errore}</p>}
      {tickets.length === 0 && <p>Nessun ticket da mostrare.</p>}
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket._id}>
            <strong>{ticket.titolo}</strong>
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
