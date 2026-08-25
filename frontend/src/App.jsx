import { useEffect, useState } from 'react';
import axios from 'axios';
function App() {
  const [messaggio, setMessaggio] = useState('carico...');
  useEffect(() => {
    axios
      .get('http://localhost:4000/api/health')
      .then((res) => setMessaggio(res.data.message))
      .catch((err) => setMessaggio('Errore: ' + err.message));
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
export default App;
