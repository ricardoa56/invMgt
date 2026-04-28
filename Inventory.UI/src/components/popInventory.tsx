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
import type { Inventory } from './interface/Inventory';

interface InventoryDialogProps {
    open: boolean;
    onClose: () => void;
    initialData: Inventory | null; // null for Add, object for Edit
    onSave: (data: Inventory) => void;
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ open, onClose, initialData, onSave }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const fetchProducts = async () => {
        try {
            const response = await axiosClient.get('product/inventory');
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

        const data: Inventory = {
            ...initialData,
            id: initialData?.id ?? 0,
            productName: '',
            productId: Number(formData.get('productId')),
            createdBy: initialData?.createdBy ?? 0,
            quantityOnHand: Number(formData.get('QuantityOnHand')) || 0,
            quantityCommitted: Number(formData.get('QuantityCommitted')) || 0,
            sellingPrice: initialData?.sellingPrice ?? 0,
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
                            name="QuantityOnHand"
                            label="Quantity on Hand"
                            defaultValue={initialData?.quantityOnHand?.toString() || ''}
                            fullWidth
                            type="number"
                            slotProps={{
                                htmlInput: {
                                step: "0.01", 
                                },
                            }}
                        />
                        <TextField
                            name="quantityCommitted"
                            label="Quantity Committed"
                            defaultValue={initialData?.quantityCommitted?.toString() || ''}
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

export default InventoryDialog;