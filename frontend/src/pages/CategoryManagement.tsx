import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    CardMedia,
} from '@mui/material';
import { supabase } from '../services/supabase';

interface Category {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
}

const CategoryManagement = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [open, setOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageFile: null as File | null,
        imagePreview: '',
    });

    useEffect(() => {
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

    const handleOpen = (category?: Category) => {
        if (category) {
            setEditCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                imageFile: null,
                imagePreview: category.image || '',
            });
        } else {
            setEditCategory(null);
            setFormData({
                name: '',
                description: '',
                imageFile: null,
                imagePreview: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditCategory(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    imageFile: file,
                    imagePreview: reader.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let imageUrl = editCategory?.image || null;

            // Eğer yeni bir resim yüklendiyse
            if (formData.imageFile) {
                const base64Data = formData.imagePreview.split(',')[1];
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('category-images')
                    .upload(`category-${Date.now()}.jpg`, formData.imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase
                    .storage
                    .from('category-images')
                    .getPublicUrl(uploadData.path);

                imageUrl = publicUrl;
            }

            if (editCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({
                        name: formData.name,
                        description: formData.description || null,
                        image: imageUrl,
                    })
                    .eq('id', editCategory.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{
                        name: formData.name,
                        description: formData.description || null,
                        image: imageUrl,
                    }]);

                if (error) throw error;
            }

            handleClose();
            fetchCategories();
        } catch (error) {
            console.error('Kategori kaydedilirken hata:', error);
        }
    };

    const handleDelete = async (id: string) => {
        // Önce bu kategoriye bağlı ürün var mı kontrol et
        const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', id);

        if (products && products.length > 0) {
            alert('Bu kategoriye bağlı ürünler var. Önce bu ürünleri silmeli veya başka bir kategoriye taşımalısınız.');
            return;
        }

        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            try {
                // Önce kategoriyi al
                const { data: category } = await supabase
                    .from('categories')
                    .select('image')
                    .eq('id', id)
                    .single();

                // Eğer resim varsa, önce storage'dan sil
                if (category?.image) {
                    const fileName = category.image.split('/').pop();
                    if (fileName) {
                        await supabase.storage
                            .from('category-images')
                            .remove([fileName]);
                    }
                }

                const { error } = await supabase
                    .from('categories')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                fetchCategories();
            } catch (error) {
                console.error('Kategori silinirken hata:', error);
            }
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 8 }}>
                <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
                    Kategori Yönetimi
                </Typography>
                <Button variant="contained" onClick={() => handleOpen()} sx={{ mt: 2 }}>
                    Yeni Kategori Ekle
                </Button>
            </Box>

            <Grid container spacing={4}>
                {categories.map((category) => (
                    <Grid item key={category.id} xs={12} sm={6} md={4}>
                        <Card>
                            {category.image && (
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={category.image}
                                    alt={category.name}
                                />
                            )}
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    {category.name}
                                </Typography>
                                {category.description && (
                                    <Typography variant="body2" color="text.secondary">
                                        {category.description}
                                    </Typography>
                                )}
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => handleOpen(category)}>
                                    Düzenle
                                </Button>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(category.id)}
                                >
                                    Sil
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Kategori Adı"
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
                        />
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="category-image-upload"
                                type="file"
                                onChange={handleImageChange}
                            />
                            <label htmlFor="category-image-upload">
                                <Button variant="outlined" component="span">
                                    Resim Seç
                                </Button>
                            </label>
                            {formData.imagePreview && (
                                <Box sx={{ mt: 2 }}>
                                    <img
                                        src={formData.imagePreview}
                                        alt="Önizleme"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>İptal</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CategoryManagement; 