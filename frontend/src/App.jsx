import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Barra from './components/Barra.jsx';
import Login from './pages/Login.jsx';
import Registrati from './pages/Registrati.jsx';
import Tickets from './pages/Tickets.jsx';
import NuovoTicket from './pages/NuovoTicket.jsx';
import DettaglioTicket from './pages/DettaglioTicket.jsx';
import Utenti from './pages/Utenti.jsx';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* La barra sta DENTRO BrowserRouter (usa Link) ma FUORI
            da Routes: cosi' non e' legata a nessun indirizzo e
            resta ferma mentre il contenuto sotto cambia. */}
        <Barra />
        {/* Il contenitore centra tutto e limita la larghezza */}
        <div className="contenitore">
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* La registrazione sta FUORI da ProtectedRoute: e' l'unica
                pagina, insieme al login, che deve vedere anche chi non
                ha ancora un account */}
            <Route path="/registrati" element={<Registrati />} />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/nuovo"
              element={
                <ProtectedRoute>
                  <NuovoTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <ProtectedRoute>
                  <DettaglioTicket />
                </ProtectedRoute>
              }
            />
            {/* La gestione dei ruoli: qui dentro ci entra chiunque sia
                collegato, ma il backend risponde 403 a chi non e' admin
                (userRoutes ha authorize('admin') su tutte le rotte).
                Il link nella barra lo vede solo l'admin: e' comodita',
                non sicurezza */}
            <Route
              path="/utenti"
              element={
                <ProtectedRoute>
                  <Utenti />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/tickets" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
