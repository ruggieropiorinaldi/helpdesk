import { createContext, useContext, useState } from 'react';

//creo un Context: una lavagna condivisa su cui chi ha qualcosa da condividera la scrive li:
//ci metteremo chi è collegato, il suo token, le funzioni per entrare e uscire
const AuthContext = createContext(null);
// creo il "Provider" e' il componente che appende la Context e ci scrive sopra
//tutti i componenti qua dentro possono leggere la Context
export function AuthProvider({ children }) {
  // Lo stato vive qui
  const [utente, setUtente] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  // Chiamata dalla pagina di login quando il server risponde bene
  function login(datiUtente, token) {
    setUtente(datiUtente);
    setAccessToken(token);
  }

  function logout() {
    setUtente(null);
    setAccessToken(null);
  }
  // "value" e' cio' che finisce scritto sulla Context
  return (
    <AuthContext.Provider value={{ utente, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// 3.una funzione di comodo per leggere tutto il contenuto della Context
export function useAuth() {
  return useContext(AuthContext);
}
