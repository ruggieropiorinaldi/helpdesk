//in questo file stabiliamo per ogni stato del ticket, dove può andare dopo
//questo perchè non posso ad esempio passare da "aperto" a "risolto" subito, deve seguire un ciclo di vita
const TRANSIZIONI = {
  aperto: ['assegnato'],
  assegnato: ['in_lavorazione'],
  in_lavorazione: ['risolto'],
  risolto: ['chiuso', 'in_lavorazione'], // chiude l'admin, riapre l'utente
  chiuso: [], // capolinea
};
export function transizioneAmmessa(statoAttuale, statoNuovo) {
  // ?. e' l'optional chaining: se TRANSIZIONI[statoAttuale] non esiste, invece di crollare restituisce undefined.
  // ?? e' il nullish coalescing: "se a sinistra c'e' undefined o null, usa il valore a destra"
  // Insieme: uno stato sconosciuto da' false invece di un errore.
  return TRANSIZIONI[statoAttuale]?.includes(statoNuovo) ?? false;
}

//questa funzione invece mi dice basandomi sullo "statoAttuale" in quali stati successivi puo andar
export function transizioniPossibili(statoAttuale) {
  return TRANSIZIONI[statoAttuale] ?? [];
}
