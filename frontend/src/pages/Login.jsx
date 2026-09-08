import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// BASE_URL sa dov'e' il backend: in locale localhost, online Render.
// Il valore arriva dalla variabile VITE_API_URL.
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
      // Qui non uso apiAuth: il login avviene PRIMA che esista una
      // sessione, quindi non c'e' nessun token da allegare.
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
    <div>
      <h1>Accedi</h1>

      {errore && <p className="errore">{errore}</p>}

      <form className="riquadro" onSubmit={invia}>
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

      {/* Chi non ha ancora un account passa di qui */}
      <p>
        Non hai un account? <Link to="/registrati">Registrati</Link>
      </p>
    </div>
  );
}

export default Login;
