export const BASE_URL = 'http://localhost:4000/api';
// manda la richiesta e restituisce la risposta GREZZA, senza leggerla e senza controllare niente
//  Chi la chiama decidera cosa farne guardando risposta.status
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
