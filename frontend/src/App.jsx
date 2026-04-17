import { BrowserRouter, Routes, Route } from 'react-router-dom';
import router from './router';
import './styles.css';

function App() {
  const renderRoutes = (routes) => {
    return routes.map((route, index) => (
      <Route
        key={index}
        index={route.index}
        path={route.path}
        element={route.element}
      >
        {route.children && renderRoutes(route.children)}
      </Route>
    ));
  };

  return (
    <BrowserRouter>
      <Routes>
        {renderRoutes(router)}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
