import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
// Stesso discorso del Login: BASE_URL sa dov'e' il backend
import { BASE_URL } from '../api/richiesta.js';

function Registrati() {
  // Un pezzo di stato per ogni campo del form
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');

  const { login } = useAuth(); //serve per scrivere sulla Context appena registrati
  const navigate = useNavigate();

  //funzione che parte quando premo "Registrati"
  async function invia(evento) {
    evento.preventDefault(); //senza questo la pagina si ricaricherebbe e perderei tutto
    setErrore('');

    try {
      // Anche qui non uso apiAuth: mi sto registrando, quindi
      // una sessione non esiste ancora e non c'e' nessun token da allegare.
      // credentials: 'include' invece serve, perche' il backend
      // risponde mettendo il refresh token nel cookie.
      const risposta = await fetch(BASE_URL + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password }),
        credentials: 'include',
      });

      const dati = await risposta.json();

      if (!risposta.ok) {
        // Qui arrivano i messaggi del backend: email gia' presa (409),
        // campi mancanti (400), password troppo corta...
        setErrore(dati.message);
        return;
      }

      // Il backend risponde come farebbe il login, quindi sono
      // gia' dentro: scrivo utente e token sulla Context e vado
      // ai ticket, senza far rifare l'accesso a mano.
      login(dati.utente, dati.accessToken);
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      setErrore('Server non raggiungibile');
    }
  }

  return (
    <div>
      <h1>Crea un account</h1>

      {errore && <p className="errore">{errore}</p>}

      <form className="riquadro" onSubmit={invia}>
        <div className="campo">
          <label>Nome</label>
          <input
            placeholder="Come ti chiami"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label>Password</label>
          {/* minLength={8} e' lo stesso minimo che ho messo nello
              schema Mongoose: il browser blocca subito, e se qualcuno
              aggira il form ci pensa comunque il database. */}
          <input
            type="password"
            placeholder="Almeno 8 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <button type="submit">Registrati</button>
      </form>

      <p className="tenue">
        Chi si registra entra sempre come <strong>utente</strong>: i ruoli
        tecnico e amministratore li assegna l'amministratore.
      </p>

      <p>
        Hai già un account? <Link to="/login">Accedi</Link>
      </p>
    </div>
  );
}

export default Registrati;
