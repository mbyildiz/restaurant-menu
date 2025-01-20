import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../services/supabase';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    images: string[];
    order_number: number;
    categories?: {
        id: string;
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
}

const base64ToUint8Array = (base64String: string): Uint8Array => {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [open, setOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        images: [] as string[],
        imageBase64Array: [] as string[],
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories:category_id (
                        id,
                        name
                    )
                `)
                .order('order_number', { ascending: true });

            if (error) throw error;

            const formattedData = data?.map(product => ({
                ...product,
                images: Array.isArray(product.images) ? product.images : []
            })) || [];

            setProducts(formattedData);
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
        }
    };

    const handleOpen = (product?: Product) => {
        if (product) {
            setEditProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                category_id: product.category_id,
                images: product.images || [],
                imageBase64Array: [],
            });
        } else {
            setEditProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category_id: '',
                images: [],
                imageBase64Array: [],
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditProduct(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({
                        ...prev,
                        imageBase64Array: [...prev.imageBase64Array, base64String]
                    }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        const existingImagesLength = formData.images?.length || 0;

        if (index < existingImagesLength) {
            // Mevcut resmi sil
            const updatedImages = formData.images?.filter((_, i) => i !== index) || [];
            setFormData({ ...formData, images: updatedImages });
        } else {
            // Yeni yüklenen resmi sil
            const newIndex = index - existingImagesLength;
            const updatedImageBase64Array = formData.imageBase64Array.filter((_, i) => i !== newIndex);
            setFormData({ ...formData, imageBase64Array: updatedImageBase64Array });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category_id: formData.category_id,
                images: formData.images || [],
            };

            const { imageBase64Array } = formData;
            let productId = editProduct?.id;

            if (editProduct) {
                const { error } = await supabase
                    .from('products')
                    .update({
                        ...productData,
                        order_number: editProduct.order_number
                    })
                    .eq('id', editProduct.id);
                if (error) throw error;
            } else {
                // En yüksek order_number'ı bul
                const { data: maxOrderData } = await supabase
                    .from('products')
                    .select('order_number')
                    .order('order_number', { ascending: false })
                    .limit(1);

                const nextOrderNumber = maxOrderData && maxOrderData.length > 0
                    ? maxOrderData[0].order_number + 1
                    : 1;

                const { data, error } = await supabase
                    .from('products')
                    .insert([{
                        ...productData,
                        order_number: nextOrderNumber
                    }])
                    .select();
                if (error) throw error;
                productId = data[0].id;
            }

            // Eğer yeni resimler varsa, doğrudan Supabase storage'a yükle
            if (imageBase64Array.length > 0) {
                const imageUrls: string[] = [...(formData.images || [])]; // Mevcut resimleri koru

                for (const imageBase64 of imageBase64Array) {
                    const base64Data = imageBase64.split(',')[1];
                    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                    const { error: uploadError } = await supabase
                        .storage
                        .from('product-images')
                        .upload(fileName, base64ToUint8Array(base64Data), {
                            contentType: 'image/jpeg'
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('product-images')
                        .getPublicUrl(fileName);

                    imageUrls.push(publicUrl);
                }

                // Ürünü yüklenen resim URL'leri ile güncelle
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ images: imageUrls })
                    .eq('id', productId);

                if (updateError) throw updateError;
            }

            await fetchProducts(); // Ürünleri yeniden yükle
            handleClose();
        } catch (error) {
            console.error('Ürün kaydedilirken hata:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                fetchProducts();
            } catch (error) {
                console.error('Ürün silinirken hata:', error);
            }
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, mt: 4 }}>
                <Typography variant="h4" component="h1">
                    Ürün Yönetimi
                </Typography>
                <Button variant="contained" onClick={() => handleOpen()}>
                    Yeni Ürün Ekle
                </Button>
            </Box>

            <Grid container spacing={4}>
                {products.map((product) => (
                    <Grid item key={product.id} xs={12} sm={6} md={4}>
                        <Card>
                            {product.images && product.images.length > 0 ? (
                                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        height: 0,
                                        paddingTop: '56.25%',
                                        bgcolor: 'grey.300',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Resim Yok
                                    </Typography>
                                </Box>
                            )}
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {product.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Kategori: {(product.categories as any)?.name || 'Belirtilmemiş'}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    color="primary"
                                    sx={{ mt: 2, fontWeight: 'bold' }}
                                >
                                    {product.price.toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY',
                                    })}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpen(product)}
                                >
                                    Düzenle
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    Sil
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Ürün Adı"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Açıklama"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            margin="normal"
                            multiline
                            rows={3}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Fiyat"
                            type="number"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData({ ...formData, price: e.target.value })
                            }
                            margin="normal"
                            required
                        />
                        {editProduct && (
                            <TextField
                                fullWidth
                                type="number"
                                label="Sıralama Numarası"
                                value={editProduct.order_number}
                                onChange={(e) => {
                                    setEditProduct({
                                        ...editProduct,
                                        order_number: parseInt(e.target.value)
                                    });
                                }}
                                margin="normal"
                            />
                        )}
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Kategori</InputLabel>
                            <Select
                                value={formData.category_id}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        category_id: e.target.value as string,
                                    })
                                }
                                label="Kategori"
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={category.id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ mt: 2 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="image-upload"
                                multiple
                                type="file"
                                onChange={handleImageChange}
                            />
                            <label htmlFor="image-upload">
                                <Button variant="contained" component="span">
                                    Resim Yükle
                                </Button>
                            </label>
                        </Box>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {formData.images?.map((imageUrl, index) => (
                                <Grid item xs={4} key={`existing-${index}`}>
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={imageUrl}
                                            alt={`Mevcut ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bgcolor: 'background.paper',
                                            }}
                                            onClick={() => removeImage(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Grid>
                            ))}
                            {formData.imageBase64Array.map((image, index) => (
                                <Grid item xs={4} key={`new-${index}`}>
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={image}
                                            alt={`Yeni ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                bgcolor: 'background.paper',
                                            }}
                                            onClick={() => removeImage(formData.images?.length + index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>İptal</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editProduct ? 'Güncelle' : 'Ekle'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProductManagement;