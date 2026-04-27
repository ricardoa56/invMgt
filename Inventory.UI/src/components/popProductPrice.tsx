import React, { useEffect, useState } from 'react';
import { type Product } from './interface/Product';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import axiosClient from './util/axiosClient';
import type { ProductPrice } from './interface/productPrice';

interface ProductPriceDialogProps {
    open: boolean;
    onClose: () => void;
    initialData: ProductPrice | null; // null for Add, object for Edit
    onSave: (data: ProductPrice) => void;
}

const ProductPriceDialog: React.FC<ProductPriceDialogProps> = ({ open, onClose, initialData, onSave }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const fetchProducts = async () => {
        try {
            const response = await axiosClient.get('product/prices');
            const productArray = response.data.products || response.data; 
            setProducts(Array.isArray(productArray) ? productArray : []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
        }
    };

    useEffect(() => {
        fetchProducts();  
    }, []);
    
    // Handlers for the form (you can add validation here later)
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const data: ProductPrice = {
            ...initialData,
            id: initialData?.id ?? 0,
            productName: '',
            productId: Number(formData.get('productId')),
            capitalPrice: Number(formData.get('capitalPrice')),
            sellingPrice: Number(formData.get('sellingPrice')),
            isActive: initialData?.isActive ?? true,
            createdBy: initialData?.createdBy ?? 0,
        };

        await onSave(data);
        await fetchProducts();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {initialData ? 'Update Product' : 'New Product'}
                </DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel id="category-select-label">Product</InputLabel>
                            <Select
                                labelId="product-select-label"
                                name="productId" // This matches your .NET DTO property
                                defaultValue={initialData?.productId || ''}
                                label="Product"
                                disabled={initialData?.productId !== undefined} // Disable if editing existing price
                            >
                                {products.map((prod: Product) => (
                                    <MenuItem key={prod.id} value={prod.id}>
                                        {prod.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            name="capitalPrice"
                            label="Capital Price"
                            defaultValue={initialData?.capitalPrice?.toString() || ''}
                            fullWidth
                            type="number"
                            slotProps={{
                                htmlInput: {
                                step: "0.01", 
                                },
                            }}
                        />
                        <TextField
                            name="sellingPrice"
                            label="Selling Price"
                            defaultValue={initialData?.sellingPrice?.toString() || ''}
                            fullWidth
                            type="number"
                            slotProps={{
                                htmlInput: {
                                step: "0.01", 
                                },
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button type="submit" variant="contained" color="success">
                        {initialData ? 'Save Changes' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ProductPriceDialog;