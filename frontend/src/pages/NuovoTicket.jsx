import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function NuovoTicket() {
  //apiAuth arriva dal Context: sa gia quale token usare, aggiunge solo l'header Autorization
  //e se il token è scaduto lo rinnova e rifa la chiamata
  const { apiAuth } = useAuth();

  // useNavigate ci da' una funzione per cambiare pagina direttamente da codice
  const navigate = useNavigate();

  // Un pezzo di stato per ogni campo del form (creo una zone di memoria per ogni stato)
  // titolo e descrizione partono vuoti: li scrive l'utente
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');

  // categoria e priorita' NON partono vuote: partono col valore
  // che vogliamo gia' selezionato nella tendina. Se partissero
  // da '' la tendina mostrerebbe una riga vuota e, se l'utente
  // non la tocca, manderemmo '' al backend -> errore 400.
  const [categoria, setCategoria] = useState('altro');
  const [priorita, setPriorita] = useState('media');

  // Qui finisce il messaggio di errore da mostrare a schermo.
  const [errore, setErrore] = useState('');

  // Questa funzione parte quando l'utente preme "Crea ticket".
  async function invia(evento) {
    // Senza questo il browser ricaricherebbe la pagina
    // (comportamento di default dei form) e perderemmo tutto
    evento.preventDefault();

    // Puliamo un eventuale errore del tentativo precedente.
    setErrore('');

    try {
      // Mandiamo i quattro campi al backend, apiAuth fa da solo JSON.stringify del body,
      // mette Content-Type e Authorization, e se la risposta non e' ok lancia un errore
      await apiAuth('/tickets', {
        method: 'POST',
        body: { titolo, descrizione, categoria, priorita },
      });

      // Questa riga viene eseguita SOLO se sopra non e' stato
      // lanciato nessun errore: ticket creato, torniamo alla lista e mostriamo tutti i ticket incluso il nuovo appena creato
      navigate('/tickets');
    } catch (err) {
      // Se il backend ha risposto male (400, 401, 500...)
      // mostriamo il messaggio invece di cambiare pagina.
      setErrore(err.message);
    }
  }

  return (
    <div>
      <h1>Nuovo ticket</h1>

      {/* L'errore adesso sta SOPRA il form: se il backend rifiuta,
          lo vedi subito senza dover scorrere in fondo.
          "errore" e' la classe del CSS: riquadro rosa col bordo.
          Prima lo stile era scritto a mano nel tag (inline), e uno
          stile inline batte qualsiasi regola del foglio di stile. */}
      {errore && <p className="errore">{errore}</p>}

      {/* onSubmit parte sia col click sul bottone
          sia premendo Invio dentro un campo.
          "riquadro" fa del form una scheda bianca col bordo. */}
      <form className="riquadro" onSubmit={invia}>
        {/* "campo" non fa niente di magico: mette solo un po' di
            spazio sotto, cosi' i campi non si toccano fra loro. */}
        <div className="campo">
          <label>Titolo</label>
          {/* Campo controllato: il valore mostrato viene dallo
              stato (value={titolo}) e ogni tasto premuto aggiorna
              lo stato (onChange). Senza onChange il campo
              sembrerebbe bloccato. */}
          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label>Descrizione</label>
          {/* <textarea> funziona esattamente come <input>:
              value + onChange. */}
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label>Categoria</label>
          {/* Anche il <select> e' controllato: value dice quale
              opzione e' selezionata, onChange aggiorna lo stato.
              ATTENZIONE: le stringhe dentro value="..." devono
              essere identiche all'enum del modello Mongoose,
              altrimenti il backend rifiuta con 400. */}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="hardware">hardware</option>
            <option value="software">software</option>
            <option value="rete">rete</option>
            <option value="altro">altro</option>
          </select>
        </div>

        <div className="campo">
          <label>Priorita'</label>
          <select
            value={priorita}
            onChange={(e) => setPriorita(e.target.value)}
          >
            <option value="bassa">bassa</option>
            <option value="media">media</option>
            <option value="alta">alta</option>
          </select>
        </div>

        {/* type="submit" fa scattare l'onSubmit del form */}
        <button type="submit">Crea ticket</button>
      </form>
    </div>
  );
}

export default NuovoTicket;
