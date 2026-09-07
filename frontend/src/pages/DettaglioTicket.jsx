import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// Le stesse transizioni della macchina a stati del backend
// Qui servono SOLO a decidere quali bottoni disegnare:
// il controllo vero resta sul server
const TRANSIZIONI = {
  aperto: [], // da "aperto" si esce solo assegnando un tecnico (puo farlo solo admin)
  assegnato: ['in_lavorazione'],
  in_lavorazione: ['risolto'],
  risolto: ['chiuso', 'in_lavorazione'],
  chiuso: [],
};
function DettaglioTicket() {
  // useParams legge il pezzo variabile dell'indirizzo Rotta "/tickets/:id"
  const { id } = useParams();
  const { utente, apiAuth } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [commenti, setCommenti] = useState([]);
  const [tecnici, setTecnici] = useState([]);
  const [testo, setTesto] = useState('');
  const [tecnicoScelto, setTecnicoScelto] = useState('');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(true);
  // Una sola funzione che riscarica tutto. La richiamiamo dopo ogni azione,
  // cosi' la pagina mostra sempre lo stato vero del database
  async function carica() {
    const datiTicket = await apiAuth('/tickets/' + id);
    setTicket(datiTicket);
    const datiCommenti = await apiAuth('/tickets/' + id + '/commenti');
    setCommenti(datiCommenti);
    // Solo l'admin assegna, quindi solo lui ha bisogno dell'elenco dei tecnici
    if (utente.ruolo === 'admin') {
      const utenti = await apiAuth('/users');
      setTecnici(utenti.filter((u) => u.ruolo === 'tecnico'));
    }
  }
  useEffect(() => {
    async function avvia() {
      try {
        await carica();
      } catch (err) {
        setErrore(err.message);
      } finally {
        setCaricamento(false);
      }
    }
    avvia();
  }, [id]); // se cambia l'id nell'indirizzo, ricarica tutto

  async function inviaCommento(evento) {
    evento.preventDefault();
    setErrore('');
    try {
      await apiAuth('/tickets/' + id + '/commenti', {
        method: 'POST',
        body: { testo },
      });
      setTesto(''); // svuota la casella
      await carica(); // e ricarica i commenti dal server
    } catch (err) {
      setErrore(err.message);
    }
  }

  async function assegna(evento) {
    evento.preventDefault();
    setErrore('');
    try {
      await apiAuth('/tickets/' + id + '/assegna', {
        method: 'PATCH',
        body: { tecnicoId: tecnicoScelto },
      });
      await carica();
    } catch (err) {
      setErrore(err.message);
    }
  }
  async function cambiaStato(nuovoStato) {
    setErrore('');
    try {
      await apiAuth('/tickets/' + id + '/stato', {
        method: 'PATCH',
        body: { stato: nuovoStato },
      });
      await carica();
    } catch (err) {
      setErrore(err.message);
    }
  }
  if (caricamento) {
    // "tenue" e' la classe del CSS: grigio e piccolo
    return <p className="tenue">Caricamento...</p>;
  }
  // Se il caricamento e' finito ma il ticket non c'e', vuol dire
  // che il backend ha risposto con un errore
  if (!ticket) {
    return <p className="errore">{errore || 'Ticket non disponibile'}</p>;
  }
  const eAdmin = utente.ruolo === 'admin';
  const eTecnico = utente.ruolo === 'tecnico';
  //controllo dallo stato attuale del ticket (ticket.stato) dove puo andare (TRANSIZIONI)
  // ??[] serve nel caso lo stato non sia uno di quelli ammessibili,
  //se lo stato del ticket NON è "chiuso" , oppure se io sono admin
  const statiPossibili = (TRANSIZIONI[ticket.stato] ?? []).filter(
    (s) => s !== 'chiuso' || eAdmin,
  );
  return (
    <div>
      <p>
        <Link to="/tickets">&larr; Torna alla lista</Link>
      </p>

      <h1>{ticket.titolo}</h1>

      {/* "riquadro" e' la scheda bianca col bordo arrotondato:
          la stessa classe la riuso per tutti i blocchi sotto. */}
      <div className="riquadro">
        <p>{ticket.descrizione}</p>

        <p>
          {/* Due classi separate da uno spazio: "stato" da' la forma
              (pillola, maiuscolo, testo bianco), "stato-qualcosa" da'
              solo il colore. La seconda la costruisco attaccando lo
              stato del ticket, cosi' il colore cambia da solo. */}
          <span className={'stato stato-' + ticket.stato}>{ticket.stato}</span>
        </p>

        {/* Le informazioni di contorno in grigio piccolo:
            non sono la cosa importante della pagina. */}
        <p className="tenue">
          Priorita' {ticket.priorita} &middot; categoria {ticket.categoria}
          <br />
          Aperto da {ticket.creatoDa ? ticket.creatoDa.nome : '-'}
          {' · '}
          assegnato a {ticket.assegnatoA ? ticket.assegnatoA.nome : 'nessuno'}
        </p>
      </div>

      {errore && <p className="errore">{errore}</p>}

      {/* ---- Pannello dell'admin: assegna un tecnico ---- */}
      {eAdmin && ticket.stato === 'aperto' && (
        <form className="riquadro" onSubmit={assegna}>
          <h3>Assegna a un tecnico</h3>

          {/* "campo" mette solo un po' di spazio sotto,
              cosi' i campi del form non si toccano. */}
          <div className="campo">
            <select
              value={tecnicoScelto}
              onChange={(e) => setTecnicoScelto(e.target.value)}
              required
            >
              <option value="">-- scegli --</option>
              {tecnici.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Assegna</button>
        </form>
      )}

      {/* ---- Pannello di chi fa avanzare il ticket ---- */}
      {(eAdmin || eTecnico) && statiPossibili.length > 0 && (
        <div className="riquadro">
          <h3>Cambia stato</h3>

          {statiPossibili.map((s) => (
            <button key={s} onClick={() => cambiaStato(s)}>
              Passa a {s}
            </button>
          ))}
        </div>
      )}

      {/* ---- L'unico potere dell'utente sullo stato ----
           Non fa avanzare niente, ma se il tecnico ha dichiarato
           risolto un problema che risolto non e', puo' rimandare
           il ticket in lavorazione. */}
      {utente.ruolo === 'utente' && ticket.stato === 'risolto' && (
        <div className="riquadro">
          <h3>Il problema non è risolto?</h3>
          <button onClick={() => cambiaStato('in_lavorazione')}>
            Riapri il ticket
          </button>
        </div>
      )}

      {/* ---- I commenti: questi li vedono tutti ---- */}
      <div className="riquadro">
        <h3>Commenti</h3>

        {commenti.length === 0 && <p className="tenue">Nessun commento.</p>}

        {/* "commenti" toglie i pallini e mette una riga
            di separazione fra un commento e l'altro. */}
        <ul className="commenti">
          {commenti.map((c) => (
            <li key={c._id}>
              <span className="autore">
                {c.autore ? c.autore.nome : 'utente rimosso'}
              </span>
              <div>{c.testo}</div>
            </li>
          ))}
        </ul>

        <form onSubmit={inviaCommento}>
          <div className="campo">
            <label>Scrivi una risposta</label>
            <textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              required
            />
          </div>

          <button type="submit">Invia commento</button>
        </form>
      </div>
    </div>
  );
}
export default DettaglioTicket;
