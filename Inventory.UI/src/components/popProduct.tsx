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
import type { Category } from './interface/Category';
import axiosClient from './util/axiosClient';

interface ProductDialogProps {
    open: boolean;
    onClose: () => void;
    initialData: Product | null; // null for Add, object for Edit
    onSave: (data: Product) => void;
}

const ProductDialog: React.FC<ProductDialogProps> = ({ open, onClose, initialData, onSave }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const fetchCategories = async () => {
        try {
            const response = await axiosClient.get('category');

            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);
    // Handlers for the form (you can add validation here later)
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        const data: Product = {
            ...initialData, // Keep the ID if we are editing
            id: initialData?.id ?? 0, // ID will be 0 for new products, backend should assign a real ID
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            categoryId: formData.get('categoryId') ? Number(formData.get('categoryId')) : 0,
            unitOfMeasurementId: initialData?.unitOfMeasurementId ?? 1,
            createdBy: initialData?.createdBy ?? 1
        };

        await onSave(data);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {initialData ? 'Update Product' : 'New Product'}
                </DialogTitle>

                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            name="name"
                            label="Product Name"
                            defaultValue={initialData?.name || ''}
                            fullWidth
                            required
                        />
                        <TextField
                            name="description"
                            label="Description"
                            defaultValue={initialData?.description || ''}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <FormControl fullWidth required>
                            <InputLabel id="category-select-label">Category</InputLabel>
                            <Select
                                labelId="category-select-label"
                                name="categoryId" // This matches your .NET DTO property
                                defaultValue={initialData?.categoryId || ''}
                                label="Category"
                            >
                                {categories.map((cat: Category) => (
                                    <MenuItem key={cat.categoryId} value={cat.categoryId}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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

export default ProductDialog;