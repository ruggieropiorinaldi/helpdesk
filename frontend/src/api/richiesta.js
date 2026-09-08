// L'indirizzo del backend non e' piu' scritto a mano.
// Vite mette in import.meta.env tutte le variabili che
// cominciano con VITE_ e le incolla nel codice al momento
// della compilazione. Se non c'e' (sviluppo), usiamo localhost
export const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export function inviaRichiesta(percorso, token, opzioni = {}) {
  return fetch(BASE_URL + percorso, {
    method: opzioni.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: opzioni.body ? JSON.stringify(opzioni.body) : undefined,
    credentials: 'include',
  });
}
