import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Barra from './components/Barra.jsx';
import Login from './pages/Login.jsx';
import Tickets from './pages/Tickets.jsx';
import NuovoTicket from './pages/NuovoTicket.jsx';
import DettaglioTicket from './pages/DettaglioTicket.jsx';
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
            <Route path="*" element={<Navigate to="/tickets" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
