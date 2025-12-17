import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Homepage from './pages/homepage/Homepage';
import Layout from './components/staticComponents/Layout';
import { DynamicRoutes } from './routes/DynamicRoutes';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import NotFoundPage from './components/staticComponents/NotFoundPage';
import Register from './pages/protected/AuthAndUserManagement/Register';
import VerifyEmail from './pages/protected/AuthAndUserManagement/VerifyEmail';
import AcceptInvitation from './pages/protected/AuthAndUserManagement/AcceptInvitation';
import ForgotPassword from './pages/protected/AuthAndUserManagement/ForgotPassword';
import ResetPassword from './pages/protected/AuthAndUserManagement/ResetPassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Homepage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />

              {/* Protected Routes with Layout */}
              <Route path="/" element={<Layout />}>
                {DynamicRoutes.map(({ path, component: Component, roles }, index) => (
                  <Route
                    key={index}
                    path={path}
                    element={
                      <ProtectedRoute requiredRoles={roles}>
                        <Component />
                      </ProtectedRoute>
                    }
                  />
                ))}
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
