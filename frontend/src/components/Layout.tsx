import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Box,
    Menu,
    MenuItem,
    Link,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import InstagramIcon from '@mui/icons-material/Instagram';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { authState, logout } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            width: '100%',
            overflow: 'hidden'
        }}>
            <AppBar position="static" className="header" sx={{ width: '100%' }}>
                <Container maxWidth={false} disableGutters>
                    <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
                        <Typography
                            variant="h6"
                            component={RouterLink}
                            to="/"
                            sx={{
                                flexGrow: 1,
                                textDecoration: 'none',
                                color: 'inherit',
                                fontSize: { xs: '1.1rem', sm: '1.25rem' }
                            }}
                        >
                            Dijital Menü
                        </Typography>
                        {authState.isAuthenticated ? (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/admin"
                                    sx={{ mr: 2 }}
                                >
                                    Yönetim
                                </Button>
                                <Button color="inherit" onClick={logout}>
                                    Çıkış Yap
                                </Button>
                            </>
                        ) : (
                            <Button color="inherit" component={RouterLink} to="/login">
                                Giriş Yap
                            </Button>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            <Box
                component="main"
                sx={{
                    width: '100%'
                }}
            >
                {children}
            </Box>

            <Box
                component="footer"
                className="footer"
                sx={{
                    py: 3,
                    px: 2,
                    mt: 'auto',
                    width: '100%',
                }}
            >
                <Container maxWidth={false}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            © 2025 Dijital Menü. Tüm hakları saklıdır
                        </Typography>
                        <Link
                            href="https://www.instagram.com/mehmet_bulent_yildiz/"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                    color: '#E1306C'
                                }
                            }}
                        >
                            <InstagramIcon sx={{ fontSize: '36px' }} />
                        </Link>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Layout; 