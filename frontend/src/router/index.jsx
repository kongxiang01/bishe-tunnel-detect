import { Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../pages/Login';
import Monitor from '../pages/Monitor';
import Events from '../pages/Events';
import Statistics from '../pages/Statistics';
import Devices from '../pages/Devices';
import Users from '../pages/Users';
import Logs from '../pages/Logs';
import Settings from '../pages/Settings';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to='/login' replace />;
  }
  return children;
};

const router = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to='/monitor' replace />,
      },
      {
        path: 'monitor',
        element: <Monitor />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'statistics',
        element: <Statistics />,
      },
      {
        path: 'devices',
        element: <Devices />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'logs',
        element: <Logs />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to='/monitor' replace />,
  },
];

export default router;
