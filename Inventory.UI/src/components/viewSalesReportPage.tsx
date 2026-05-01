import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, TextField, Stack } from "@mui/material";
import axiosClient from "./util/axiosClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";

// Define an interface matching your GetSalesReportResponse DTO
interface SalesReport {
  orderId: number;
  customerName: string;
  orderDate: string;
  capitalAmount: number;
  totalAmount: number;
  earnings: number;
}

const SalesReportPage: React.FC = () => {
  const [data, setData] = useState<SalesReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Create local dates
  const firstDayLocal = new Date(year, month, 1);
  const lastDayLocal = new Date(year, month + 1, 0);

  // Helper function to format as YYYY-MM-DD without timezone shifting
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = "" + (d.getMonth() + 1);
    const day = "" + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
  };

  const [startDate, setStartDate] = useState(formatDate(firstDayLocal));
  const [endDate, setEndDate] = useState(formatDate(lastDayLocal));

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      // Using params for [FromQuery] as we discussed
      const response = await axiosClient.get("order/salesreport", {
        params: { startDate, endDate },
      });
      setData(response.data);
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]); // Refetch when dates change

  const columns = useMemo<MRT_ColumnDef<SalesReport>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: "Order #",
        size: 100,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        size: 200,
      },
      {
        accessorKey: "orderDate",
        header: "Date",
        size: 150,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: "capitalAmount",
        header: "Capital Cost",
        size: 150,
        Cell: ({ cell }) => `${cell.getValue<number>().toLocaleString()}`,
        Footer: ({ table }) => (
          <Box color="error.main">
            {table
              .getFilteredRowModel()
              .rows.reduce((sum, row) => sum + row.original.capitalAmount, 0)
              .toLocaleString()}
          </Box>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Revenue",
        size: 150,
        Cell: ({ cell }) => (
          <Box sx={{ fontWeight: "bold" }}>
            {cell.getValue<number>().toLocaleString()}
          </Box>
        ),
        Footer: ({ table }) => (
          <Box sx={{ fontWeight: "bold" }}>
            {table
              .getFilteredRowModel()
              .rows.reduce((sum, row) => sum + row.original.totalAmount, 0)
              .toLocaleString()}
          </Box>
        ),
      },
      {
        accessorKey: "earnings",
        header: "Earnings",
        size: 150,
        Cell: ({ cell }) => (
          <Box sx={{ fontWeight: "bold", color: "success.main" }}>
            {cell.getValue<number>().toLocaleString()}
          </Box>
        ),
        Footer: ({ table }) => (
          <Box sx={{ fontWeight: "bold", color: "success.main" }}>
            {table
              .getFilteredRowModel()
              .rows.reduce((sum, row) => sum + row.original.earnings, 0)
              .toLocaleString()}
          </Box>
        ),
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    state: { isLoading },
    enableColumnResizing: true,
    enableTableFooter: true, // This enables the "Grand Total" at the bottom
    initialState: {
      density: "compact",
      pagination: { pageSize: 15, pageIndex: 0 },
    },
    renderTopToolbarCustomActions: () => (
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center" }} // Move alignItems here
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", mr: 2 }}>
          Sales Report
        </Typography>
        <TextField
          label="From"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
      </Stack>
    ),
  });

  return (
    <Box sx={{ p: 4 }}>
      <MaterialReactTable table={table} />
    </Box>
  );
};

export default SalesReportPage;
