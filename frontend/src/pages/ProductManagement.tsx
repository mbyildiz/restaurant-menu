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
    CardMedia,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '../components';
import { products as productService, upload, categories as categoryService } from '../services/api';

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
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        imageFile: null as File | null,
        imagePreview: '',
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            if (response.success) {
                setCategories(response.data || []);
            } else {
                console.error('Kategoriler yüklenirken hata:', response.error);
            }
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productService.getAll();
            if (response.success) {
                const formattedData = response.data?.map((product: Product) => ({
                    ...product,
                    images: Array.isArray(product.images) ? product.images : []
                })) || [];

                setProducts(formattedData);
            } else {
                console.error('Ürünler yüklenirken hata:', response.error);
            }
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
                imageFile: null,
                imagePreview: product.images && product.images.length > 0 ? product.images[0] : '',
            });
        } else {
            setEditProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category_id: '',
                imageFile: null,
                imagePreview: '',
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
        if (files && files[0]) {
            const file = files[0];
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

    const removeImage = (index: number) => {
        setFormData({
            ...formData,
            imageFile: null,
            imagePreview: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validasyonu
        const trimmedName = formData.name.trim();
        const trimmedDescription = formData.description.trim();
        const price = parseFloat(formData.price);

        if (!trimmedName) {
            alert('Ürün adı zorunludur');
            return;
        }

        if (!formData.category_id) {
            alert('Kategori seçimi zorunludur');
            return;
        }

        if (isNaN(price) || price <= 0) {
            alert('Geçerli bir fiyat giriniz');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', trimmedName);
            formDataToSend.append('description', trimmedDescription);
            formDataToSend.append('price', price.toString());
            formDataToSend.append('category_id', formData.category_id);

            // Eğer yeni bir resim yüklendiyse veya mevcut resim varsa
            if (formData.imageFile) {
                formDataToSend.append('image', formData.imageFile);
            } else if (formData.imagePreview && editProduct) {
                // Mevcut resmi koru
                formDataToSend.append('images', JSON.stringify(editProduct.images));
            }

            if (editProduct) {
                const response = await productService.update(editProduct.id, formDataToSend);
                if (response.success) {
                    handleClose();
                    fetchProducts();
                } else {
                    console.error('Ürün güncellenirken hata:', response.error);
                }
            } else {
                const response = await productService.create(formDataToSend);
                if (response.success) {
                    handleClose();
                    fetchProducts();
                } else {
                    console.error('Ürün eklenirken hata:', response.error);
                }
            }
        } catch (error) {
            console.error('Ürün kaydedilirken hata:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            try {
                const response = await productService.delete(id);
                if (response.success) {
                    fetchProducts();
                } else {
                    console.error('Ürün silinirken hata:', response.error);
                }
            } catch (error) {
                console.error('Ürün silinirken hata:', error);
            }
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(products);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedProducts = items.map((item, index) => ({
            ...item,
            order_number: index + 1
        }));

        try {
            setProducts(updatedProducts);

            const orderData = updatedProducts.map(p => ({
                id: p.id,
                order_number: p.order_number
            }));

            const response = await productService.updateOrder(orderData);

            if (!response.success) {
                console.error('Sıralama güncellenirken hata:', response.error);
                await fetchProducts(); // Hata durumunda orijinal sıralamayı geri yükle
            }
        } catch (error) {
            console.error('Sıralama işlemi sırasında bir hata oluştu:', error);
            await fetchProducts(); // Hata durumunda orijinal sıralamayı geri yükle
        }
    };

    // Helper function to convert base64 to Blob
    const base64ToBlob = (base64: string, type: string): Blob => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);

            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type });
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Box sx={{ mb: 4, mt: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            label="Ürün Ara"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ürün adı veya açıklaması ile arayın..."
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpen()}
                            sx={{ float: 'right' }}
                        >
                            Yeni Ürün Ekle
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Array.from({ length: Math.ceil(filteredProducts.length / 4) }).map((_, rowIndex) => (
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
                                    {filteredProducts
                                        .slice(rowIndex * 4, (rowIndex + 1) * 4)
                                        .map((product, index) => (
                                            <Draggable
                                                key={product.id}
                                                draggableId={product.id}
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
                                                                    height: 250,
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
                                                            {product.images && product.images.length > 0 && (
                                                                <CardMedia
                                                                    component="img"
                                                                    height="200"
                                                                    image={product.images[0]}
                                                                    alt={product.name}
                                                                />
                                                            )}
                                                            <CardContent sx={{ flexGrow: 1 }}>
                                                                <Typography gutterBottom variant="h6" component="div">
                                                                    {product.name}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {product.description}
                                                                </Typography>
                                                                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                                                    {product.price.toFixed(2)} TL
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Kategori: {product.categories?.name}
                                                                </Typography>
                                                            </CardContent>
                                                            <CardActions>
                                                                <Button size="small" onClick={() => handleOpen(product)}>
                                                                    Düzenle
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDelete(product.id)}
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
                            {formData.imagePreview && (
                                <Grid item xs={4}>
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={formData.imagePreview}
                                            alt="Önizleme"
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
                                            onClick={() => removeImage(0)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Grid>
                            )}
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