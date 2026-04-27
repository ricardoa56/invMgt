import React from 'react';
import { type Category } from './interface/Category';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Checkbox,
} from '@mui/material';

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  initialData: Category | null; // null for Add, object for Edit
  onSave: (data: Category) => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({ open, onClose, initialData, onSave }) => {
  
  // Handlers for the form (you can add validation here later)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const data: Category = {
      ...initialData, // Keep the ID if we are editing
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      isActive: initialData?.isActive ?? true,
    };

    onSave(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {initialData ? 'Update Category' : 'New Category'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="name"
              label="Category Name"
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
            <div>
                <span style={{ marginRight: 8 }}><label style={{ fontSize: '14px' }}>Active</label></span>
                <Checkbox name="isActive" defaultChecked={initialData?.isActive ?? true} />
            </div>
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

export default CategoryDialog;