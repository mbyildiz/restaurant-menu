import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login, authState } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authState.isAuthenticated) {
            const redirectUrl = localStorage.getItem('redirectUrl') || '/admin';
            localStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
        }
    }, [authState.isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setError(null);
        setIsSubmitting(true);

        try {
            await login(email, password);
        } catch (err) {
            let errorMessage = 'Giriş başarısız';

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Yönetici Girişi
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-posta Adresi"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        error={!!error}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Şifre"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        error={!!error}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, height: 48 }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Giriş Yap'
                        )}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login; 