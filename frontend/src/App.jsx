import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Tickets from './pages/Tickets.jsx';
function App() {
  return (
    // AuthProvider sta FUORI da tutto: la lavagna deve essere
    // leggibile da ogni pagina.
    <AuthProvider>
      <BrowserRouter>
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
          {/* path="*" vuol dire "qualsiasi altro indirizzo".
              Chi arriva su / o su una pagina inesistente
              finisce sui ticket — e se non e' collegato,
              ProtectedRoute lo rimanda al login. */}
          <Route path="*" element={<Navigate to="/tickets" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;
