import React, { useMemo, useState, useEffect } from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import axiosClient from "./util/axiosClient";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import CustomersDialog from "./popCustomer";
import type { Customer } from "./interface/Customer";

const ViewCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get("customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSave = async (payload: Customer) => {
    if (selectedCustomer) {
      await axiosClient.put(`customers/${selectedCustomer.id}`, payload);
    } else {
      await axiosClient.post("customers", payload);
    }
    fetchCustomers();
    setDialogOpen(false);
  };

  const columns = useMemo<MRT_ColumnDef<any>[]>(() => [
    { accessorKey: "name", header: "Customer Name", size: 200 },
    { accessorKey: "email", header: "Email", size: 200 },
    { accessorKey: "mobileNo", header: "Phone", size: 150 },
    { accessorKey: "messengerId", header: "Messenger", size: 250 },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: customers,
    state: { isLoading },
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Tooltip title="Edit">
        <IconButton onClick={() => { setSelectedCustomer(row.original); setDialogOpen(true); }}>
          <EditIcon />
        </IconButton>
      </Tooltip>
    ),
    renderTopToolbarCustomActions: () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => { setSelectedCustomer(null); setDialogOpen(true); }}
        sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" }, textTransform: "none", fontWeight: "bold" }}
      >
        Add Customer
      </Button>
    ),
    initialState: { density: "compact" },
  });

  return (
    <Box sx={{ p: 4 }}>
      <MaterialReactTable table={table} />
      <CustomersDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={selectedCustomer}
        onSave={handleSave}
      />
    </Box>
  );
};

export default ViewCustomersPage;