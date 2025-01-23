import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ThemeContextProvider, useTheme } from './context/ThemeContext';
import { createDynamicTheme } from './theme/createDynamicTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import ProductManagement from './pages/ProductManagement';
import CompanyInfo from './pages/CompanyInfo';
import ThemeSettingsPage from './pages/ThemeSettings';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { themeSettings, loading } = useTheme();

  if (loading || !themeSettings) {
    return <div>Yükleniyor...</div>;
  }

  const theme = createDynamicTheme(themeSettings);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute>
                    <CategoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute>
                    <ProductManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/company"
                element={
                  <ProtectedRoute>
                    <CompanyInfo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/themes/:companyId"
                element={
                  <ProtectedRoute>
                    <ThemeSettingsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeContextProvider>
      <AppContent />
    </ThemeContextProvider>
  );
}

export default App;
