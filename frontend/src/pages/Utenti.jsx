import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Utenti() {
  // utente = chi sta guardando la pagina (serve per non farsi
  // il bottone su se stessi), apiAuth = il modo di parlare col backend
  const { utente, apiAuth } = useAuth();

  const [utenti, setUtenti] = useState([]);
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);

  // Una funzione sola che riscarica l'elenco. La richiamo dopo ogni
  // cambio di ruolo, cosi' quello che vedo e' sempre quello che c'e'
  // davvero nel database e non quello che immagino io.
  async function carica() {
    const dati = await apiAuth('/users');
    setUtenti(dati);
  }

  useEffect(() => {
    async function avvia() {
      try {
        await carica();
      } catch (err) {
        // Se non sono admin il backend risponde 403 e finisco qui
        setErrore(err.message);
      } finally {
        setCaricamento(false);
      }
    }
    avvia();
  }, []); // [] = una volta sola, all'apertura della pagina

  async function cambiaRuolo(id, ruoloNuovo) {
    setErrore('');
    try {
      await apiAuth('/users/' + id + '/ruolo', {
        method: 'PATCH',
        body: { ruolo: ruoloNuovo },
      });
      await carica(); // ricarico dal server invece di aggiornare a mano
    } catch (err) {
      setErrore(err.message);
    }
  }

  if (caricamento) {
    return <p className="tenue">Caricamento...</p>;
  }

  return (
    <div>
      <h1>Utenti</h1>

      <p className="tenue">
        Da qui l'amministratore promuove un utente a tecnico, o lo riporta
        indietro. Gli amministratori non compaiono con nessun bottone.
      </p>

      {errore && <p className="errore">{errore}</p>}

      <ul className="lista">
        {utenti.map((u) => (
          <li key={u._id}>
            <strong>{u.nome}</strong>

            <div className="tenue">
              {u.email}
              {' · '}
              {/* Riuso le stesse pillole colorate degli stati:
                  cambia solo il nome della seconda classe. */}
              <span className={'stato stato-' + u.ruolo}>{u.ruolo}</span>
            </div>

            {/* Il bottone che compare dipende dal ruolo attuale:
                un solo passaggio possibile alla volta, cosi' non
                serve nessun menu a tendina e si sbaglia meno.
                E su me stesso non disegno niente: se mi togliessi
                il ruolo admin resterei chiuso fuori da questa pagina. */}
            {u._id !== utente.id && u.ruolo === 'utente' && (
              <button onClick={() => cambiaRuolo(u._id, 'tecnico')}>
                Promuovi a tecnico
              </button>
            )}

            {u._id !== utente.id && u.ruolo === 'tecnico' && (
              <button onClick={() => cambiaRuolo(u._id, 'utente')}>
                Riporta a utente
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Utenti;
