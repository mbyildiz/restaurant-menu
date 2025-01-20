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
    InputAdornment,
} from '@mui/material';
import { DragDropContext, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { supabase } from '../services/supabase';
import { StrictModeDroppable } from '../components';
import SearchIcon from '@mui/icons-material/Search';

interface Category {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order_number: number;
}

const CategoryManagement = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
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

    useEffect(() => {
        const filtered = categories.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (category.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        setFilteredCategories(filtered);
    }, [searchQuery, categories]);

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

        const sourceRowIndex = parseInt(result.source.droppableId.split('-')[1]);
        const destinationRowIndex = parseInt(result.destination.droppableId.split('-')[1]);
        const sourceIndex = sourceRowIndex * 4 + result.source.index;
        const destinationIndex = destinationRowIndex * 4 + result.destination.index;

        // Eğer pozisyon değişmemişse işlem yapma
        if (sourceIndex === destinationIndex) return;

        const newCategories = Array.from(categories);
        const [movedItem] = newCategories.splice(sourceIndex, 1);
        newCategories.splice(destinationIndex, 0, movedItem);

        // Önce UI'ı güncelle
        setCategories(newCategories);

        try {
            // Sıralama numaralarını güncelle
            const updates = newCategories.map((category, index) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                image: category.image,
                order_number: index + 1
            }));

            // Batch update için tüm güncellemeleri bir dizide topla
            const { error } = await supabase
                .from('categories')
                .upsert(updates);

            if (error) throw error;
        } catch (error) {
            console.error('Sıralama güncellenirken hata:', error);
            // Hata durumunda orijinal listeyi geri yükle
            fetchCategories();
        }
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Box sx={{ mb: 4, mt: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Kategori Ara"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Kategori adı veya açıklaması ile arayın..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpen()}
                            sx={{ float: 'right' }}
                        >
                            Yeni Kategori Ekle
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Array.from({ length: Math.ceil(filteredCategories.length / 4) }).map((_, rowIndex) => (
                        <StrictModeDroppable
                            key={`row-${rowIndex}`}
                            droppableId={`row-${rowIndex}`}
                            direction="horizontal"
                        >
                            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(1, 1fr)',
                                            sm: 'repeat(2, 1fr)',
                                            md: 'repeat(3, 1fr)',
                                            lg: 'repeat(4, 1fr)',
                                        },
                                        gap: 3,
                                        minHeight: '100px',
                                        padding: 2,
                                        backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                >
                                    {filteredCategories
                                        .slice(rowIndex * 4, (rowIndex + 1) * 4)
                                        .map((category, index) => (
                                            <Draggable
                                                key={category.id}
                                                draggableId={category.id}
                                                index={index}
                                            >
                                                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
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
                                                                transition: 'transform 0.2s, opacity 0.2s',
                                                                '& .MuiCardMedia-root': {
                                                                    height: 200,
                                                                    objectFit: 'cover'
                                                                },
                                                                '& .MuiCardContent-root': {
                                                                    flexGrow: 1,
                                                                    p: 2.5
                                                                },
                                                                '& .MuiCardActions-root': {
                                                                    p: 2,
                                                                    justifyContent: 'space-between'
                                                                }
                                                            }}
                                                        >
                                                            {category.image && (
                                                                <CardMedia
                                                                    component="img"
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
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))}
                                </Box>
                            )}
                        </StrictModeDroppable>
                    ))}
                </Box>
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