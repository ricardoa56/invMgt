import React, { useMemo, useState, useEffect } from "react";
import { Box, IconButton, Button, Tooltip } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { type Product } from "./interface/Product";
import ConfirmDialog from "./util/ConfrimDialog";
import ProductDialog from "./popProduct";
import axiosClient from "./util/axiosClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";

const ViewProductsPage: React.FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [productName, setProductName] = useState<string>("");
  const executeDelete = async () => {
    if (targetId) {
      await axiosClient.delete(`${"product"}/${targetId}`);
      setConfirmOpen(false);
      fetchProducts();
    }
  };

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const handleSave = async (data: Product) => {
    const isUpdate = selectedProduct?.id && selectedProduct.id > 0;
    if (isUpdate) {
      await axiosClient.put(`${"product"}/${selectedProduct.id}`, data);
    } else {
      data.createdBy = Number(localStorage.getItem("userid"));
      console.log(`payload is ${data}`)
      await axiosClient.post("product", data);
    }
    fetchProducts();
    setProductDialogOpen(false);
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("product");

      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns = useMemo<MRT_ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Product Name",
        size: 250,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 350,
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 150,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: products,
    state: { isLoading },
    enableRowActions: true,
    enableColumnResizing: true,
    enableGlobalFilter: true, // Search bar
    enablePagination: true,
    initialState: {
      density: "compact", // Standard corporate density
      showGlobalFilter: true,
      pagination: { pageSize: 15, pageIndex: 0 },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: "8px",
        border: "1px solid #e0e0e0",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "#f5f5f5",
        fontWeight: "bold",
      },
    },
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "Actions", // Row header name
        size: 120, // Increase width to accommodate two icons comfortably
        muiTableHeadCellProps: {
          align: "center",
        },
        muiTableBodyCellProps: {
          align: "center",
        },
      },
    },
    renderRowActions: ({ row }) => (
      <Box sx={{ display: "flex", gap: "0.5rem" }}>
        <Tooltip title="Edit">
          <IconButton
            onClick={() => {
              setSelectedProduct(row.original);
              setProductDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" sx={{ color: "primary.main" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={() => {
              setTargetId(row.original.id ?? 0);
              setConfirmOpen(true);
              setProductName(row.original.name);
            }}
          >
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
          setSelectedProduct(null); // Clear any previous selection
          setProductDialogOpen(true); // Open the dialog for adding a new product
        }}
        sx={{
          bgcolor: "#2e7d32",
          "&:hover": { bgcolor: "#1b5e20" },
          textTransform: "none",
          fontWeight: "bold",
        }}
      >
        Add
      </Button>
    ),
  });

  return (
    <Box sx={{ p: 4 }}>
      <MaterialReactTable table={table} />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Product?"
        message={`Are you sure you want to delete "${productName}"? This action cannot be undone.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeDelete}
      />
      <ProductDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        initialData={selectedProduct}
        onSave={handleSave}
      />
    </Box>
  );
};

export default ViewProductsPage;
