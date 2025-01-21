import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Grid,
    Card,
    CardMedia,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Box,
    Divider,
    Link
} from '@mui/material';
import { Product, Category, CompanyInfo } from '../types';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import Carousel from 'react-material-ui-carousel';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { visitors, company, categories as categoryApi, products as productApi } from '../services/api';

const Home = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const productsRef = useRef<HTMLDivElement>(null);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        // Kategorilerin yarısı görünecek şekilde scroll
        const categoryHeight = 100; // Kategori kartının yaklaşık yüksekliği
        const offset = categoryHeight / 2;
        setTimeout(() => {
            const element = productsRef.current;
            if (element) {
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: elementPosition - offset,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    useEffect(() => {
        incrementVisitorCount();
        fetchProducts();
        fetchCategories();
        fetchCompanyInfo();
    }, []);

    const incrementVisitorCount = async () => {
        try {
            await visitors.increment();
        } catch (error) {
            // Hata durumunda sessizce devam et
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const data = await company.getInfo();
            setCompanyInfo(data);
        } catch (error) {
            // Hata durumunda sessizce devam et
        }
    };

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await categoryApi.getAll();
            const data = response.data;

            if (!Array.isArray(data)) {
                console.error('Kategori verisi dizi formatında değil:', data);
                setCategories([]);
                return;
            }

            const formattedData = data.map((category: Category) => {
                let imageUrl = null;
                if (category.image && typeof category.image === 'string') {
                    try {
                        new URL(category.image);
                        imageUrl = category.image;
                    } catch (e) {
                        // Geçersiz URL durumunda sessizce devam et
                    }
                }

                return {
                    ...category,
                    image: imageUrl
                };
            });

            // Kategorileri order_number'a göre sırala
            const sortedData = formattedData.sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
            setCategories(sortedData);
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productApi.getAll();
            const data = response.data; // API yanıtının data özelliğini al

            if (!Array.isArray(data)) {
                console.error('Ürün verisi dizi formatında değil:', data);
                setProducts([]);
                return;
            }

            const formattedData = data.map((product: Product) => {
                let formattedImages: string[] = [];

                if (Array.isArray(product.images)) {
                    formattedImages = product.images.flatMap((img: unknown) => {
                        if (Array.isArray(img)) {
                            return img.filter((url): url is string => typeof url === 'string');
                        } else if (typeof img === 'string') {
                            return [img];
                        }
                        return [];
                    });
                }

                return {
                    ...product,
                    images: formattedImages
                };
            });

            setProducts(formattedData);
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter((product) => product.category_id === selectedCategory);

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                bgcolor: 'background.default',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <Container
                maxWidth={false}
                sx={{
                    py: { xs: 2, sm: 3, md: 4 },
                    px: { xs: 2, sm: 3, md: 4 },
                    width: '100%'
                }}
            >
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        {companyInfo?.logo_url && (
                            <img
                                src={companyInfo.logo_url}
                                alt="Company Logo"
                                style={{ maxWidth: '200px', marginBottom: '20px' }}
                            />
                        )}
                        <Typography
                            variant="h3"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                backgroundClip: 'text',
                                textFillColor: 'transparent',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                mb: 3
                            }}
                        >
                            {companyInfo?.company_name ? `${companyInfo.company_name} Dijital Menü` : 'Dijital Menü'}
                        </Typography>
                    </Box>
                </Container>

                <Box
                    sx={{
                        width: '100%',
                        maxWidth: '1600px',
                        mx: 'auto'
                    }}
                >
                    <Grid
                        container
                        spacing={{ xs: 1, sm: 2, md: 3 }}
                        sx={{
                            mb: { xs: 1, sm: 2 },
                            width: '100%',
                            mx: 0
                        }}
                    >
                        <Grid item xs={3} sm={2} md={1.5}>
                            <Card
                                onClick={() => handleCategoryClick('all')}
                                sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    border: '1px solid',
                                    borderColor: selectedCategory === 'all' ? 'primary.main' : 'grey.300',
                                    bgcolor: selectedCategory === 'all' ? 'primary.main' : 'background.paper',
                                    color: selectedCategory === 'all' ? 'primary.contrastText' : 'text.primary',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: selectedCategory === 'all' ? 'primary.dark' : 'grey.50',
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3,
                                    },
                                    transition: 'all 0.3s ease-in-out',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    boxShadow: selectedCategory === 'all' ? 3 : 1
                                }}
                            >
                                <Box sx={{
                                    p: { xs: 1, sm: 1.5 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: { xs: 60, sm: 70, md: 80 }
                                }}>
                                    <RestaurantMenuIcon sx={{
                                        fontSize: { xs: 28, sm: 32, md: 36 },
                                        mb: 1,
                                        color: selectedCategory === 'all' ? 'inherit' : 'primary.main'
                                    }} />
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        align="center"
                                        sx={{
                                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                            fontWeight: 600,
                                            letterSpacing: 0.5
                                        }}
                                    >
                                        Tümü
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                        {categories.map((category) => (
                            <Grid item xs={3} sm={2} md={1.5} key={category.id}>
                                <Card
                                    onClick={() => handleCategoryClick(category.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        height: '100%',
                                        border: '2px solid',
                                        borderColor: selectedCategory === category.id ? 'primary.main' : 'grey.300',
                                        background: selectedCategory === category.id
                                            ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                                            : 'background.paper',
                                        color: selectedCategory === category.id ? 'white' : 'text.primary',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            borderColor: '#2196F3',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 8px rgba(33, 150, 243, 0.2)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                        {category.image && (
                                            <CardMedia
                                                component="img"
                                                image={category.image}
                                                alt={category.name}
                                                sx={{ height: 40, objectFit: 'contain', mb: 1 }}
                                            />
                                        )}
                                        <Typography
                                            variant="body2"
                                            component="div"
                                            sx={{
                                                fontWeight: 'medium',
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                            }}
                                        >
                                            {category.name}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Box ref={productsRef} />

                    <Grid
                        container
                        spacing={2}
                        sx={{ mt: 1 }}
                    >
                        {filteredProducts.map((product) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 2,
                                        },
                                    }}
                                >
                                    {product.images && product.images.length > 0 ? (
                                        <Carousel
                                            autoPlay={false}
                                            animation="slide"
                                            indicators={product.images.length > 1}
                                            navButtonsAlwaysVisible={product.images.length > 1}
                                            navButtonsProps={{
                                                style: {
                                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                                    borderRadius: 0,
                                                }
                                            }}
                                            sx={{ minHeight: 200 }}
                                        >
                                            {product.images.map((image, index) => (
                                                <CardMedia
                                                    key={index}
                                                    component="img"
                                                    height="200"
                                                    image={image}
                                                    alt={product.name}
                                                    sx={{
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ))}
                                        </Carousel>
                                    ) : (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image="https://via.placeholder.com/300"
                                            alt={product.name}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                        <Typography
                                            gutterBottom
                                            variant="h6"
                                            component="h2"
                                            sx={{
                                                color: '#2e7d32',
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                mb: 1
                                            }}
                                        >
                                            {product.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1,
                                                color: '#666'
                                            }}
                                        >
                                            {product.description}
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 'bold',
                                                mt: 'auto',
                                                color: '#2e7d32'
                                            }}
                                        >
                                            {product.price} ₺
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>

            {/* Footer with company info */}
            {companyInfo && (companyInfo.company_name || companyInfo.company_address || companyInfo.phone_number || companyInfo.social_media) && (
                <Box
                    sx={{
                        width: '100%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        py: 4,
                        mt: 4
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={3} justifyContent="center">
                            {companyInfo.company_name && (
                                <Grid item xs={12} textAlign="center">
                                    <Typography variant="h5" component="div" gutterBottom>
                                        {companyInfo.company_name}
                                    </Typography>
                                </Grid>
                            )}
                            {companyInfo.company_address && (
                                <Grid item xs={12} textAlign="center">
                                    <Typography variant="body1" gutterBottom>
                                        {companyInfo.company_address}
                                    </Typography>
                                </Grid>
                            )}
                            {companyInfo.phone_number && (
                                <Grid item xs={12} textAlign="center">
                                    <Typography variant="body1" gutterBottom>
                                        {companyInfo.phone_number}
                                    </Typography>
                                </Grid>
                            )}
                            {companyInfo.social_media && Object.values(companyInfo.social_media).some(value => value) && (
                                <Grid item xs={12} textAlign="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                                        {companyInfo.social_media.facebook && (
                                            <Link href={companyInfo.social_media.facebook} target="_blank" color="inherit">
                                                <FacebookIcon />
                                            </Link>
                                        )}
                                        {companyInfo.social_media.instagram && (
                                            <Link href={companyInfo.social_media.instagram} target="_blank" color="inherit">
                                                <InstagramIcon />
                                            </Link>
                                        )}
                                        {companyInfo.social_media.twitter && (
                                            <Link href={companyInfo.social_media.twitter} target="_blank" color="inherit">
                                                <TwitterIcon />
                                            </Link>
                                        )}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Container>
                </Box>
            )}

            {/* Konum Haritası */}
            {companyInfo?.maps && (
                <Container maxWidth="lg" sx={{ mt: 6, mb: 4 }}>
                    <Typography
                        variant="h4"
                        component="h2"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            mb: 3
                        }}
                    >
                        Bizi Ziyaret Edin
                    </Typography>
                    <Box sx={{ width: '100%', height: '400px', borderRadius: 2, overflow: 'hidden' }}>
                        <iframe
                            src={companyInfo.maps}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </Box>
                    {companyInfo.company_address && (
                        <Typography
                            variant="body1"
                            sx={{
                                textAlign: 'center',
                                mt: 2,
                                color: 'text.secondary'
                            }}
                        >
                            {companyInfo.company_address}
                        </Typography>
                    )}
                </Container>
            )}
        </Box>
    );
};

export default Home; 