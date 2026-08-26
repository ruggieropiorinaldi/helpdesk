import { useState, useEffect } from 'react';
function App() {
  // Creo una "variabile di stato" con :
  // messaggio     = il valore attuale
  // setMessaggio  = la funzione per cambiarlo
  // 'Carico...'   = il valore iniziale
  // Ogni volta che chiamo setMessaggio, React ridisegna la pagina.
  const [messaggio, setMessaggio] = useState('Carico...');

  // useEffect esegue la funzione che gli passo.
  // L'array vuoto [] alla fine significa "eseguila una volta sola, quando il componente compare" altrimenti la eseguirebbe all'infinito
  useEffect(() => {
    // Definisco una funzione async, perché la chiamata al backend è lenta e va aspettata con await.
    async function chiediAlBackend() {
      try {
        // fetch manda la richiesta HTTP e restituisce una Promise. Ho messo await per far aspettare che arrivi la risposta.
        const risposta = await fetch('http://localhost:4000/api/health');
        // La risposta contiene testo grezzo: .json() lo trasforma in un oggetto JavaScript. È anch'essa un'operazione asincrona, quindi serve un altro await.
        const dati = await risposta.json();
        // Aggiorno lo stato con il messaggio ricevuto, cosi aggiorno la pagina con il nuovo testo
        setMessaggio(dati.message);
      } catch (errore) {
        // Ci finiamo se il backend è spento o irraggiungibile.
        setMessaggio('Errore: ' + errore.message);
      }
    }
    // La definizione qui sopra non esegue niente:
    // questa riga è quella che la fa partire.
    chiediAlBackend();
  }, []);
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>HelpDesk</h1>
      <p>
        Risposta dal backend: <strong>{messaggio}</strong>
      </p>
    </div>
  );
}
// export default serve per rendere il componente utilizzabile anche dagli altri file
export default App;
