import React, { useMemo, useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import axiosClient from "./util/axiosClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { type Inventory } from "./interface/Inventory";
import InventoryDialog from "./popInventory";

const viewInventoryPage: React.FC = () => {
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null,
  );
  const handleSave = async (data: Inventory) => {
    const isUpdate = selectedInventory?.id && selectedInventory.id > 0;
    console.log("Saving inventory data:", data, "Is update:", isUpdate);
    if (isUpdate) {
      await axiosClient.put(`${"inventory"}/${selectedInventory.id}`, data);
    } else {
      data.createdBy = Number(localStorage.getItem("userid"));
      await axiosClient.post("inventory", data);
    }
    await fetchInventory();
    setInventoryDialogOpen(false);
  };

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("inventory");
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const columns = useMemo<MRT_ColumnDef<Inventory>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product Name",
        size: 300,
      },
      {
        accessorKey: "quantityOnHand",
        header: "Quantity On Hand",
        size: 220,
      },
      {
        accessorKey: "quantityCommitted",
        header: "Quantity Committed",
        size: 220,
      },
      {
        id: "totalValue",
        header: "Total Value",
        accessorFn: (row) => row.quantityOnHand * (row.sellingPrice || 0),
        // 3. Format the output as currency
        Cell: ({ cell }) => (
          <Box sx={{ fontWeight: "bold", color: "primary.main" }}>
            {cell.getValue<number>().toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Box>
        ),
        Footer: () => {
          const totalSum = inventory.reduce((sum, row) => {
            const q = Number(row.quantityOnHand) || 0;
            const p = Number(row.sellingPrice) || 0;

            if (inventory.length > 0 && p === 0) {
              console.log("Row Error - Price is 0 for:", row);
            }

            return sum + q * p;
          }, 0);
          return (
            <Box sx={{ color: "error.main", fontWeight: "bold" }}>
              Total:{" "}
              {totalSum.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Box>
          );
        },
      },
    ],
    [inventory],
  );

  const table = useMaterialReactTable({
    columns,
    data: inventory,
    enableTableFooter: true,
    state: { isLoading },
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

    renderTopToolbarCustomActions: () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          setSelectedInventory(null); // Clear any previous selection
          setInventoryDialogOpen(true); // Open the dialog for adding a new inventory item
          console.log("Add new inventory item action triggered");
        }}
        sx={{
          backgroundColor: "#2e7d32", // Professional green to match 'Active' status
          "&:hover": { backgroundColor: "#1b5e20" },
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
      <InventoryDialog
        open={inventoryDialogOpen}
        onClose={() => setInventoryDialogOpen(false)}
        initialData={selectedInventory}
        onSave={handleSave}
      />
    </Box>
  );
};

export default viewInventoryPage;
