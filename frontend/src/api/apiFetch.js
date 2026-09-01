const BASE_URL = 'http://localhost:4000/api';
// percorso => '/tickets', '/auth/me', ...
// token => l'access token, o null per le rotte pubbliche
// opzioni => { method, body } — servono solo per POST e PATCH
export async function apiFetch(percorso, token, opzioni = {}) {
  const risposta = await fetch(BASE_URL + percorso, {
    // Se non passi un metodo, allora imposto di default che è una GET
    method: opzioni.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      // L'intestazione che il tuo middleware authenticate va a leggere
      Authorization: 'Bearer ' + token,
    },
    // Il body serve solo per POST e PATCH: se non c'e', lo lasciamo undefined e fetch lo ignora.
    body: opzioni.body ? JSON.stringify(opzioni.body) : undefined,
    credentials: 'include',
  });
  const dati = await risposta.json();

  if (!risposta.ok) {
    throw new Error(dati.message);
  }
  return dati;
}
