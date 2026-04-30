import React, { useEffect, useMemo, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { Box, Typography, Tooltip, IconButton, Button } from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import type { ProductPrice } from "./interface/productPrice";
import axiosClient from "./util/axiosClient";
import ProductPriceDialog from "./popProductPrice";

const ViewProductPricePage: React.FC = () => {
  const [productPriceDialogOpen, setProductPriceDialogOpen] = useState(false);
  const [selectedProductPrice, setSelectedProductPrice] =
    useState<ProductPrice | null>(null);
  const handleSave = async (data: ProductPrice) => {
    const isUpdate = selectedProductPrice?.id && selectedProductPrice.id > 0;
    if (isUpdate) {
      await axiosClient.put(
        `${"productprice"}/${selectedProductPrice.id}`,
        data,
      );
    } else {
      data.createdBy = Number(localStorage.getItem("userid"));
      await axiosClient.post("productprice", data);
    }
    fetchProductPrice();
    setProductPriceDialogOpen(false);
  };

  const [productPrices, setProductPrice] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductPrice = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("productprice");
      setProductPrice(response.data.productPrice || response.data);
    } catch (error) {
      console.error("Error fetching product prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductPrice();
  }, []);

  const columns = useMemo<MRT_ColumnDef<ProductPrice>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product",
        size: 300,
      },
      {
        accessorKey: "capitalPrice",
        header: "Capital (Cost)",
        size: 200,
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) =>
          `₱${cell.getValue<number>()?.toLocaleString() ?? "0.00"}`,
      },
      {
        accessorKey: "sellingPrice",
        header: "Selling Price",
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ cell }) => (
          <Typography
            sx={{ fontWeight: "bold" }}
            color="primary.main"
            variant="body2"
          >
            ₱{cell.getValue<number>()?.toLocaleString() ?? "0.00"}
          </Typography>
        ),
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: productPrices,
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
              setSelectedProductPrice(row.original);
              setProductPriceDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" sx={{ color: "primary.main" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={() => {
              console.log("Delete clicked for:", row.original);
              // setTargetId(row.original.id ?? 0);
              // setConfirmOpen(true);
              // setProductName(row.original.name);
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
          setSelectedProductPrice(null);
          setProductPriceDialogOpen(true);
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
      <ProductPriceDialog
        open={productPriceDialogOpen}
        onClose={() => setProductPriceDialogOpen(false)}
        initialData={selectedProductPrice}
        onSave={handleSave}
      />
    </Box>
  );
};

export default ViewProductPricePage;
