import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PeopleIcon from '@mui/icons-material/People';
import { supabase } from '../config/supabaseClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [visitorCount, setVisitorCount] = useState(0);

    useEffect(() => {
        getVisitorCount();
    }, []);

    const getVisitorCount = async () => {
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('count')
                .single();

            if (error) throw error;

            if (data) {
                setVisitorCount(data.count);
            }
        } catch (error) {
            // Hata durumunda sessizce devam et
        }
    };

    const menuItems = [
        {
            title: 'Kategoriler',
            description: 'Kategori ekle, düzenle ve sil',
            icon: <CategoryIcon sx={{ fontSize: 40 }} />,
            path: '/admin/categories'
        },
        {
            title: 'Ürünler',
            description: 'Ürün ekle, düzenle ve sil',
            icon: <RestaurantMenuIcon sx={{ fontSize: 40 }} />,
            path: '/admin/products'
        },
        {
            title: 'Firma Bilgileri',
            description: 'Firma bilgilerini düzenle',
            icon: <BusinessIcon sx={{ fontSize: 40 }} />,
            path: '/admin/company'
        }
    ];

    return (
        <Container>
            <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 4 }}>
                Yönetim Paneli
            </Typography>
            <Grid container spacing={3}>
                {menuItems.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                '&:hover': {
                                    boxShadow: 6,
                                    cursor: 'pointer'
                                }
                            }}
                            onClick={() => navigate(item.path)}
                        >
                            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                {item.icon}
                                <Typography gutterBottom variant="h5" component="h2" sx={{ mt: 2 }}>
                                    {item.title}
                                </Typography>
                                <Typography>
                                    {item.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                    <Card
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40 }} />
                            <Typography gutterBottom variant="h5" component="h2" sx={{ mt: 2 }}>
                                Ziyaretçi Sayısı
                            </Typography>
                            <Typography variant="h3" color="primary">
                                {visitorCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminDashboard; 