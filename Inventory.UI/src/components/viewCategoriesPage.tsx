import { useMemo, useState, useEffect } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, Chip, IconButton, Button, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { type Category } from './interface/Category';
import CategoryDialog from './popCategory';
import ConfirmDialog from './util/ConfrimDialog';
import axiosClient from './util/axiosClient';

const ViewCategoriesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const handleSave = async (data: Category) => {
    const isUpdate = selectedCategory?.categoryId && selectedCategory.categoryId > 0;
    if (isUpdate) {
      await axiosClient.put(`${'category'}/${selectedCategory.categoryId}`, data);
    } else {
      data.createdBy = Number(localStorage.getItem('userid'));
      await axiosClient.post('category', data);
    }
    fetchCategories();
    setDialogOpen(false);
  };

  // State for delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const executeDelete = async () => {
    if (targetId) {
      await axiosClient.delete(`${'category'}/${targetId}`);
      setConfirmOpen(false);
      fetchCategories();
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get('category');

      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
        // Using a monospaced font for IDs looks more "system-like"
        muiTableBodyCellProps: {
          sx: { fontFamily: 'monospace', color: 'text.secondary' },
        },
      },
      {
        accessorKey: 'name',
        header: 'Category Name',
        size: 200,
        muiTableBodyCellProps: {
          sx: { fontWeight: 600 }, // Make the main identifier bolder
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 380,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 120,
        // Custom Cell to render a professional status badge
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<boolean>() ? 'Active' : 'Inactive'}
            color={cell.getValue<boolean>() ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}
          />
        ),
      },
    ],
    [],
  );


  const table = useMaterialReactTable({
    columns,
    data: categories,
    state: { isLoading },
    enableRowActions: true,
    enableColumnResizing: true,
    enableGlobalFilter: true,
    muiSearchTextFieldProps: {
      slotProps: {
        input: {
          // This often catches the prop that is leaking to the DOM
          'inputprops': undefined,
        } as any,
      },
      variant: 'outlined',
      size: 'small',
    },

    // If you are using individual column filtering, add this to clean up those inputs too
    muiFilterTextFieldProps: {
      sx: { m: '0.5rem 0', width: '100%' },
      variant: 'outlined',
      size: 'small',
    },
    enablePagination: true,
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Actions', // Row header name
        size: 120,        // Increase width to accommodate two icons comfortably
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
    },
    initialState: {
      density: 'compact', // Standard corporate density
      showGlobalFilter: true,
      pagination: { pageSize: 15, pageIndex: 0 },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
      },
    },

    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: '0.5rem' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => {
            setSelectedCategory(row.original); // Fill form with row data
            setDialogOpen(true);          // Trigger!
            console.log('Edit', row.original);
          }}>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => {
            setTargetId(row.original.categoryId ?? 0);
            setConfirmOpen(true);
            setCategoryName(row.original.name);
          }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),

    renderTopToolbarCustomActions: () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          setSelectedCategory(null); // Clear form for new entry
          setDialogOpen(true);      // Trigger!
        }}
        sx={{
          backgroundColor: '#2e7d32', // Professional green to match 'Active' status
          '&:hover': { backgroundColor: '#1b5e20' },
          textTransform: 'none',
          fontWeight: 'bold'
        }}
      >
        Add
      </Button>
    )
  });

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <MaterialReactTable table={table} />
      <CategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={selectedCategory}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category?"
        message={`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeDelete}
      />
    </Box>
  );
}


export default ViewCategoriesPage;