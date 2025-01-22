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
    IconButton,
} from '@mui/material';
import { DragDropContext, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { categories as categoriesApi, upload } from '../services/api';
import { StrictModeDroppable } from '../components';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

interface Category {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order_number: number;
}

interface FormData {
    name: string;
    description: string;
    imageFile: File | null;
    imagePreview: string;
}

const CategoryManagement = () => {
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        imageFile: null,
        imagePreview: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const filtered = categoryList.filter(category =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (category.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        setFilteredCategories(filtered);
    }, [searchQuery, categoryList]);

    const fetchCategories = async () => {
        try {
            const response = await categoriesApi.getAll();
            if (response.success) {
                setCategoryList(response.data || []);
            } else {
                console.error('Kategoriler yüklenirken hata:', response.error);
            }
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

        // Form validasyonu
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            alert('Kategori adı zorunludur');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', trimmedName);
            formDataToSend.append('description', formData.description.trim());

            if (formData.imageFile) {
                formDataToSend.append('image', formData.imageFile);
            }

            if (editCategory) {
                formDataToSend.append('order_number', editCategory.order_number.toString());
                
                try {
                    const response = await categoriesApi.update(editCategory.id, formDataToSend);
                    

                    if (response.success) {
                        // Başarılı güncelleme sonrası listeyi yenile
                        await fetchCategories();
                        handleClose();
                    } else {
                        console.error('Kategori güncellenirken hata:', response.error);
                    }
                } catch (updateError) {
                    console.error('Kategori güncellenirken hata:', updateError);
                }
            } else {
                try {
                    const response = await categoriesApi.create(formDataToSend);
                    

                    if (response.success) {
                        // Başarılı oluşturma sonrası listeyi yenile
                        await fetchCategories();
                        handleClose();
                    } else {
                        console.error('Kategori oluşturulurken hata:', response.error);
                    }
                } catch (createError) {
                    console.error('Kategori oluşturulurken hata:', createError);
                }
            }
        } catch (error) {
            console.error('Kategori kaydedilirken hata:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
            try {
                const response = await categoriesApi.delete(id);
                if (response.success) {
                    setTimeout(() => {
                        fetchCategories();
                    }, 500);
                } else {
                    console.error('Kategori silinirken hata:', response.error);
                }
            } catch (error) {
                console.error('Kategori silinirken hata:', error);
            }
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(categoryList);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedCategories = items.map((item, index) => ({
            ...item,
            order_number: index + 1
        }));

        try {
            setCategoryList(updatedCategories);

            const orderData = updatedCategories.map(c => ({
                id: c.id,
                order_number: c.order_number
            }));

            const response = await categoriesApi.updateOrder(orderData);

            if (!response.success) {
                console.error('Sıralama güncellenirken hata:', response.error);
                await fetchCategories(); // Hata durumunda orijinal sıralamayı geri yükle
            }
        } catch (error) {
            console.error('Sıralama işlemi sırasında bir hata oluştu:', error);
            await fetchCategories(); // Hata durumunda orijinal sıralamayı geri yükle
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
                <StrictModeDroppable droppableId="categories" direction="horizontal">
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
                            {filteredCategories.map((category, index) => (
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
                                                        loading="lazy"
                                                        crossOrigin="anonymous"
                                                        sx={{
                                                            height: 200,
                                                            objectFit: 'contain',
                                                            backgroundColor: 'background.paper'
                                                        }}
                                                        onError={(e) => {
                                                            console.error('Resim yükleme hatası:', e);
                                                            const imgElement = e.target as HTMLImageElement;
                                                            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SZXNpbSBZw7xrbGVuZW1lZGk8L3RleHQ+PC9zdmc+';
                                                        }}
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
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(category.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
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
                                        loading="lazy"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'contain'
                                        }}
                                        onError={(e) => {
                                            console.error('Önizleme resmi yükleme hatası:', e);
                                            const imgElement = e.target as HTMLImageElement;
                                            imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SZXNpbSBZw7xrbGVuZW1lZGk8L3RleHQ+PC9zdmc+';
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