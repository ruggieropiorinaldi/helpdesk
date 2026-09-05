import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
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
      const risposta = await fetch('http://localhost:4000/api/auth/login', {
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
    <form onSubmit={invia}>
      <h1>Accedi</h1>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit">Entra</button>
      {errore && <p style={{ color: 'red' }}>{errore}</p>}
    </form>
  );
}
export default Login;
