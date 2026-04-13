import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Monitor from './pages/Monitor';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to='/login' replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/monitor' element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
        <Route path='*' element={<Navigate to='/monitor' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
