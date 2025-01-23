import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { createDynamicTheme } from './theme/createDynamicTheme';
import { ThemeSettings } from './services/themeService';
import api from './services/api';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagement from './pages/CategoryManagement';
import ProductManagement from './pages/ProductManagement';
import CompanyInfo from './pages/CompanyInfo';
import ThemeSettingsPage from './pages/ThemeSettings';
import ProtectedRoute from './components/ProtectedRoute';

// Varsayılan tema ayarları
const defaultThemeSettings: ThemeSettings = {
  id: 'default',
  company_id: 'default',
  name: 'Varsayılan Tema',
  is_active: true,
  colors: {
    primary: '#2E7D32',
    secondary: '#FF5722',
    accent: '#1976D2',
    background: '#F8F9FA',
    text: '#2C3E50',
    link: '#1976D2',
    header: '#FFFFFF',
    footer: '#F8F9FA',
    buttons: {
      primary: '#2E7D32',
      secondary: '#FF5722',
      danger: '#DC3545'
    }
  },
  typography: {
    mainFont: 'Roboto, sans-serif',
    headingFont: 'Roboto, sans-serif',
    sizes: {
      base: '16px',
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.75rem',
      h4: '1.5rem',
      h5: '1.25rem',
      h6: '1rem',
      button: '1rem',
      menuItem: '1rem'
    }
  },
  layout: {
    maxWidth: '1200px',
    containerPadding: '1rem',
    sectionSpacing: '2rem',
    gridGap: '1rem',
    margin: '1rem'
  },
  components: {
    card: {
      backgroundColor: '#FFFFFF',
      shadowEffect: '0 2px 4px rgba(0,0,0,0.1)',
      borderRadius: '8px'
    },
    button: {
      borderRadius: '4px',
      padding: '0.5rem 1rem',
      hoverEffect: 'brightness(0.95)'
    },
    input: {
      borderColor: '#E2E8F0',
      backgroundColor: '#FFFFFF',
      borderRadius: '4px',
      focusEffect: 'border-color: #3182CE'
    }
  },
  navigation: {
    menuBackground: '#FFFFFF',
    menuItemHover: '#F7FAFC',
    menuFontStyle: 'normal',
    menuItemSpacing: '0.5rem',
    activeItemStyle: 'bold'
  },
  animations: {
    transitionDuration: '0.2s',
    animationSpeed: '0.3s',
    hoverEffects: 'ease-in-out'
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px'
  },
  branding: {
    logoSize: '120px',
    logoPosition: 'left',
    brandColors: {
      primary: '#2E7D32',
      secondary: '#FF5722'
    }
  },
  states: {
    loadingSpinner: '#2E7D32',
    error: '#DC3545',
    success: '#28A745',
    info: '#17A2B8'
  },
  social_media: {
    iconColors: {
      facebook: '#1877F2',
      twitter: '#1DA1F2',
      instagram: '#E4405F'
    },
    iconSize: '24px',
    hoverEffects: 'scale(1.1)'
  }
};

function App() {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTheme = async () => {
      try {
        const response = await api.get('/themes/active');
        setThemeSettings(response.data);
      } catch (error) {
        console.error('Tema yüklenirken hata:', error);
        // API hatası durumunda varsayılan temayı kullan
        setThemeSettings(defaultThemeSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTheme();
  }, []);

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

export default App;
