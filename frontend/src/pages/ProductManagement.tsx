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

interface FormData {
    name: string;
    description: string;
    price: string;
    category_id: string;
    imageFiles: File[];
    imagePreviews: string[];
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
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        price: '',
        category_id: '',
        imageFiles: [],
        imagePreviews: []
    });
    const [loading, setLoading] = useState(false);

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
                imageFiles: [],
                imagePreviews: Array.isArray(product.images) ? product.images : []
            });
        } else {
            setEditProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category_id: '',
                imageFiles: [],
                imagePreviews: []
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditProduct(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            console.log('Seçilen dosya sayısı:', files.length);
            const totalSize = files.reduce((acc, file) => acc + file.size, 0);
            console.log('Toplam boyut:', totalSize / 1024 / 1024, 'MB');

            // Toplam boyut kontrolü (50MB)
            if (totalSize > 50 * 1024 * 1024) {
                alert('Toplam resim boyutu 50MB\'ı geçemez');
                return;
            }

            // Her bir resim için önizleme oluştur
            files.forEach(file => {
                console.log('İşlenen dosya:', file.name, file.size / 1024, 'KB');
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => {
                        console.log('Mevcut resim sayısı:', prev.imageFiles.length);
                        const newState = {
                            ...prev,
                            imageFiles: [...prev.imageFiles, file],
                            imagePreviews: [...prev.imagePreviews, reader.result as string]
                        };
                        console.log('Yeni resim sayısı:', newState.imageFiles.length);
                        return newState;
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form gönderiliyor...');
        console.log('Yüklenecek resim sayısı:', formData.imageFiles.length);

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
            setLoading(true);
            let imageUrls: string[] = [];

            // Yeni yüklenen resimleri işle
            if (formData.imageFiles.length > 0) {
                console.log('Resimler yükleniyor...');
                const uploadResult = await upload.uploadMultipleFiles(formData.imageFiles);
                console.log('Yükleme sonucu:', uploadResult);
                if (uploadResult.error) {
                    throw new Error('Resimler yüklenirken hata oluştu');
                }
                imageUrls = uploadResult.data?.urls || [];
                console.log('Yüklenen resim URL\'leri:', imageUrls);
            }

            // Düzenleme modunda mevcut resimleri koru
            if (editProduct) {
                console.log('Düzenleme modu - mevcut resimler korunuyor');
                const existingImages = formData.imagePreviews.filter(preview =>
                    !preview.startsWith('data:')
                );
                console.log('Mevcut resimler:', existingImages);
                imageUrls = [...existingImages, ...imageUrls];
            }

            // Ürün bilgilerini gönder
            const productData = {
                name: trimmedName,
                description: trimmedDescription,
                price: price,
                category_id: formData.category_id,
                images: imageUrls
            };
            console.log('Frontend - Gönderilecek ürün verisi:', productData);
            console.log('Frontend - images verisi türü:', typeof productData.images);
            console.log('Frontend - images array mi?', Array.isArray(productData.images));
            console.log('Frontend - images içeriği:', JSON.stringify(productData.images));

            if (editProduct) {
                const response = await productService.update(editProduct.id, productData);
                console.log('Frontend - Güncelleme yanıtı:', response);
                if (response.success) {
                    handleClose();
                    fetchProducts();
                } else {
                    console.error('Ürün güncellenirken hata:', response.error);
                }
            } else {
                const response = await productService.create(productData);
                console.log('Oluşturma yanıtı:', response);
                if (response.success) {
                    handleClose();
                    fetchProducts();
                } else {
                    console.error('Ürün eklenirken hata:', response.error);
                }
            }
        } catch (error) {
            console.error('İşlem hatası:', error);
            alert('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
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

    const handleImageDelete = (index: number) => {
        setFormData(prev => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, i) => i !== index),
            imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
        }));
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
                                                            <CardMedia
                                                                component="img"
                                                                height="200"
                                                                image={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png'}
                                                                alt={product.name}
                                                                sx={{ objectFit: 'cover' }}
                                                            />
                                                            {product.images && product.images.length > 1 && (
                                                                <Box sx={{
                                                                    position: 'absolute',
                                                                    top: 10,
                                                                    right: 10,
                                                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                                    color: 'white',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    +{product.images.length - 1}
                                                                </Box>
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
                                id="raised-button-file"
                                type="file"
                                multiple
                                onChange={handleImageChange}
                            />
                            <label htmlFor="raised-button-file">
                                <Button variant="contained" component="span">
                                    Resim Yükle
                                </Button>
                            </label>
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Birden fazla resim seçebilirsiniz (max 50MB toplam)
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                {formData.imagePreviews.map((preview, index) => (
                                    <Box key={index} sx={{ position: 'relative', width: '150px' }}>
                                        <img
                                            src={preview}
                                            alt={`Önizleme ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <IconButton
                                            sx={{
                                                position: 'absolute',
                                                top: 5,
                                                right: 5,
                                                bgcolor: 'background.paper',
                                                '&:hover': {
                                                    bgcolor: 'error.main',
                                                    color: 'white'
                                                }
                                            }}
                                            onClick={() => handleImageDelete(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
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