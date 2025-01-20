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
import { DragDropContext, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { supabase } from '../services/supabase';
import { StrictModeDroppable } from '../components';

interface Category {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order_number: number;
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
                .order('order_number', { ascending: true });

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
                        order_number: editCategory.order_number
                    })
                    .eq('id', editCategory.id);

                if (error) throw error;
            } else {
                // En yüksek order_number'ı bul
                const { data: maxOrderData } = await supabase
                    .from('categories')
                    .select('order_number')
                    .order('order_number', { ascending: false })
                    .limit(1);

                const nextOrderNumber = maxOrderData && maxOrderData.length > 0
                    ? maxOrderData[0].order_number + 1
                    : 1;

                const { error } = await supabase
                    .from('categories')
                    .insert([{
                        name: formData.name,
                        description: formData.description || null,
                        image: imageUrl,
                        order_number: nextOrderNumber
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

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // Eğer pozisyon değişmemişse işlem yapma
        if (sourceIndex === destinationIndex) return;

        const newCategories = Array.from(categories);
        const [movedItem] = newCategories.splice(sourceIndex, 1);
        newCategories.splice(destinationIndex, 0, movedItem);

        // Önce UI'ı güncelle
        setCategories(newCategories);

        // Sonra veritabanını güncelle
        try {
            // Sadece etkilenen öğeleri güncelle
            const startIdx = Math.min(sourceIndex, destinationIndex);
            const endIdx = Math.max(sourceIndex, destinationIndex);

            const updates = newCategories
                .slice(startIdx, endIdx + 1)
                .map((item, index) => ({
                    id: item.id,
                    name: item.name,
                    order_number: startIdx + index + 1
                }));

            // Toplu güncelleme yap
            const { error } = await supabase
                .from('categories')
                .upsert(updates, { onConflict: 'id' });

            if (error) throw error;
        } catch (error) {
            console.error('Sıralama güncellenirken hata:', error);
            fetchCategories();
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

            <DragDropContext onDragEnd={handleDragEnd}>
                <StrictModeDroppable droppableId="droppable" direction="horizontal">
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <Box
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2,
                                p: 2,
                                minHeight: '100px'
                            }}
                        >
                            {categories.map((category, index) => (
                                <Draggable
                                    key={category.id}
                                    draggableId={category.id}
                                    index={index}
                                >
                                    {(provided, snapshot) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                                width: {
                                                    xs: '100%',
                                                    sm: 'calc(50% - 16px)',
                                                    md: 'calc(25% - 16px)'
                                                },
                                                ...provided.draggableProps.style
                                            }}
                                        >
                                            <Card
                                                elevation={snapshot.isDragging ? 6 : 1}
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    opacity: snapshot.isDragging ? 0.6 : 1,
                                                    transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                                                    transition: 'transform 0.2s, opacity 0.2s'
                                                }}
                                            >
                                                {category.image && (
                                                    <CardMedia
                                                        component="img"
                                                        height="200"
                                                        image={category.image}
                                                        alt={category.name}
                                                    />
                                                )}
                                                <CardContent sx={{ flexGrow: 1 }}>
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
                                        </Box>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Box>
                    )}
                </StrictModeDroppable>
            </DragDropContext>

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
                        {editCategory && (
                            <TextField
                                fullWidth
                                type="number"
                                label="Sıralama Numarası"
                                value={editCategory.order_number}
                                onChange={(e) => {
                                    setEditCategory({
                                        ...editCategory,
                                        order_number: parseInt(e.target.value)
                                    });
                                }}
                                margin="normal"
                            />
                        )}
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