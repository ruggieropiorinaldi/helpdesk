import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { utente } = useAuth();
  // Nessun utente = non ha fatto il login
  // <Navigate> e' un componente che manda il browser da un'altra parte.
  if (!utente) {
    return <Navigate to="/login" />; //se non c'è nessun utente loggato, allora reindirizzo alla pagina di login
  }
  // Altrimenti mostriamo quello che ci hanno passato dentro
  return children;
}
export default ProtectedRoute;

//questo non rappresenta "sicurezza": serve a non far vedere pagine vuote a chi non è collegato
//chi volesse aggirarlo riuscirebbe, ma non otterrebbe nulla (senza token) e il backend risponderebbe 401
