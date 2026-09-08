import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BASE_URL } from '../api/richiesta.js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const { login } = useAuth(); //prendo login dalla Context
  const navigate = useNavigate();

  //funzione per quando premo "invia" per i dati
  async function invia(evento) {
    evento.preventDefault(); //impedisco che quando invio la pagina si riaggiorni in automatico
    setErrore('');
    try {
      const risposta = await fetch(BASE_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const dati = await risposta.json();
      if (!risposta.ok) {
        setErrore(dati.message);
        return;
      }
      // Scriviamo utente e token sulla Context
      login(dati.utente, dati.accessToken);
      // cambio pagina verso i ticket dell'utente appena loggato
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      setErrore('Server non raggiungibile');
    }
  }

  return (
    // Il titolo e l'errore escono dal form e vanno in un <div>
    // che li contiene tutti: cosi' il riquadro bianco e' il form
    // e basta, e sembra una scheda di accesso.
    <div>
      <h1>Accedi</h1>

      {/* "errore" e' la classe del CSS: riquadro rosa col bordo.
          Prima lo stile era scritto dentro il tag (inline), e uno
          stile inline batte qualsiasi regola del foglio di stile. */}
      {errore && <p className="errore">{errore}</p>}

      <form className="riquadro" onSubmit={invia}>
        {/* "campo" mette solo un po' di spazio sotto,
            cosi' i due campi non si toccano. */}
        <div className="campo">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Entra</button>
      </form>
    </div>
  );
}

export default Login;
