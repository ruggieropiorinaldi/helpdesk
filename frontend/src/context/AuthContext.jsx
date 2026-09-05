import { createContext, useContext, useEffect, useState } from 'react';
import { BASE_URL, inviaRichiesta } from '../api/richiesta.js';

//in React c'è il problema che i dati viaggiano solo verso il basso, da un componente a quelli che contiene.
//nel mio caso abbiamo una struttura piu o meno cosi:
//App
// |---Login   qui dentro c'è l'utente dopo il login
// |---Tickets ma a noi serve qui l'utente
//Login e Tickets sono fratelli, ma nessuno dei due contiene l'altro, eppure devono collaborare
//Se volessimo far arrivare l'utente da Login a Tickets, dovrebbe risalire verso Login, poi App, poi scendere su Tickets
//nel caso di pochi okk, ma se tanti componenti si verifica "prop drilling" (mi ritrovo a dover passare utente tra componenti sopra e sotto che magari non gli servono, spercando tempo e risorse)

//SOLUZIONE: Context : è come se fosse una lavagna dove ogni componente mette qui dei dati che potrebbero essere richiesti da altri componenti
const AuthContext = createContext(null);

// creo il "Provider: componente che appende la Context e ci scrive sopra
//tutti i componenti che metterò qua dentro (children) potranno leggere la Context
export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null); //creo la memoria per l'utentre
  const [accessToken, setAccessToken] = useState(null); //creo la memoria per l'access Token
  // "pronto" serve a non far vedere niente finche' non abbiamo finito di controllare se c'era una sessione da riprendere
  const [pronto, setPronto] = useState(false);

  // Chiede un access token nuovo usando il cookie
  // Restituisce il token se ci riesce, null se la sessione e' finita
  async function rinnovaToken() {
    const risposta = await fetch(BASE_URL + '/auth/refresh', {
      method: 'POST',
      credentials: 'include', //serve epr dire al browser "invia insieme alla richiesta anche il cookie relativo alla sessione"
    });
    if (!risposta.ok) {
      return null;
    }
    const dati = await risposta.json();
    setUtente(dati.utente);
    setAccessToken(dati.accessToken);
    return dati.accessToken;
  }

  // La funzione che le pagine useranno per parlare col backend.
  async function apiAuth(percorso, opzioni = {}) {
    // Primo tentativo, col token che abbiamo adesso
    let risposta = await inviaRichiesta(percorso, accessToken, opzioni);
    // 401 = token scaduto o assente => allora proviamo a rinnovare
    if (risposta.status === 401) {
      const tokenNuovo = await rinnovaToken();
      if (!tokenNuovo) {
        // Nemmeno il refresh funziona: la sessione e' finita davvero
        setUtente(null);
        setAccessToken(null);
        throw new Error('Sessione scaduta, rifai il login');
      }
      // Secondo tentativo, col token nuovo. L'utente non vede niente
      risposta = await inviaRichiesta(percorso, tokenNuovo, opzioni);
    }
    const dati = await risposta.json();
    if (!risposta.ok) {
      throw new Error(dati.message);
    }
    return dati;
  }

  //controllo se all'avvio dell'applicazione c'era una sessione aperta
  useEffect(() => {
    async function ripristina() {
      // Se il cookie c'e' ed e' valido, rinnovaToken riempie utente e token
      // se non c'e', restituisce null e amen
      await rinnovaToken();
      setPronto(true);
    }
    ripristina();
  }, []); // [] = una volta sola, all'avvio
  function login(datiUtente, token) {
    setUtente(datiUtente);
    setAccessToken(token);
  }

  // Logout vero: prima spegne la sessione sul server, poi svuota lo stato qui
  async function logout() {
    await fetch(BASE_URL + '/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUtente(null);
    setAccessToken(null);
  }
  return (
    <AuthContext.Provider
      value={{ utente, accessToken, login, logout, apiAuth }}
    >
      {/* Finche' non abbiamo controllato la sessione non mostriamo
          niente: altrimenti si vedrebbe la pagina di login per un
          istante anche a chi era gia' collegato. */}
      {pronto ? children : <p>Caricamento...</p>}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
