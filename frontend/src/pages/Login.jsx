import { useState } from 'react';

function Login() {
  // Quattro pezzi di memoria, uno per ogni cosa che cambia.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [utente, setUtente] = useState(null);
  const [errore, setErrore] = useState('');

  // Questa funzione parte quando premi Entra
  async function invia(evento) {
    evento.preventDefault(); //impedisco che il browser si comporti come di default (ovvero che una volta inviati i dati del form, ricarichi la pagina)
    setErrore('');
    try {
      //chiamo il backend tramite fetch
      const risposta = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', //di solito un browser ignora i dati provenienti da altre origini: con include ci assicuriamo che quando facciamo login, vengano tenuti conto i dati dei cookie gia presenti
      });
      // Secondo await: apre il pacchetto e ci da' l'oggetto vero.
      const dati = await risposta.json();
      // ATTENZIONE: fetch NON considera un 401 un errore: qualsiasi risposta (anche "credenziali non valide") è sempre un tentativo riuscito, non di errore
      // Il controllo dobbiamo esplicitarlo noi
      if (!risposta.ok) {
        setErrore(dati.message);
        return;
      }
      setUtente(dati.utente);
    } catch (err) {
      // Qui ci finiamo solo se la richiesta non e' partita proprio:
      // backend spento, rete assente
      setErrore('Server non raggiungibile');
    }
  }
  // Se il login e' riuscito, mostriamo il saluto invece del form.
  // Un componente puo' avere piu' di un return: il primo che viene eseguito vince
  if (utente) {
    return (
      <div>
        <h1>Ciao {utente.nome}</h1>
        <p>Il tuo ruolo e': {utente.ruolo}</p>
      </div>
    );
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
          onChange={(e) => setPassword(e.target.value)} //prendo ogni carattere scritto nella casella e la metto nella variabile password
        />
      </div>
      <button type="submit">Entra</button>

      {errore && <p style={{ color: 'red' }}>{errore}</p>}
    </form>
  );
}
export default Login;
