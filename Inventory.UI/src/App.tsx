import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./components/loginPage";
import ProtectedRoute from "./components/protectedRoute";
import SideNav from "./components/sideNav";
import Header from "./components/header";
import "bootstrap/dist/css/bootstrap.min.css";
import ViewProductsPage from "./components/viewProductsPage";
import { createTheme, ThemeProvider } from "@mui/material";
import "./App.css";
import ViewCategoriesPage from "./components/viewCategoriesPage";
import ViewProductPricePage from "./components/viewProductPricePage";
import ViewInventoryPage from "./components/viewInventoryPage";
import ReceiveStockPage from "./components/receiveStockPage";
import StockAdjustmentPage from "./components/stockAdjustmentPage";
import ViewOrdersPage from "./components/viewOrdersPage";
import ViewCustomersPage from "./components/viewCustomersPage";
import SalesReportPage from "./components/viewSalesReportPage";
import ViewRefundsPage from "./components/viewRefundPage";
import { useAuth } from "./context/AuthContext";

const corporateTheme = createTheme({
  typography: {
    fontFamily: '"arial", sans-serif',
    fontSize: 12,
    button: {
      textTransform: "none", // Professional look: keeps buttons from being ALL CAPS
    },
  },
});

function getPageTitle(pathname: string) {
  if (pathname === "/category/view") return "Categories";
  if (pathname === "/category/add") return "Add Category";
  if (pathname === "/productprice/view") return "Product Prices";
  if (pathname === "/inventory/view") return "Inventory";
  if (pathname === "/inventory/receive") return "Receive Stock";
  if (pathname === "/inventory/adjustment") return "Stock Adjustment";
  if (pathname === "/orders/view") return "Orders";
  if (pathname === "/customers/view") return "Customers";
  if (pathname === "/orders/salesreport") return "Sales Report";
  if (pathname === "/orders/refund") return "Refund";
  if (pathname === "/login") return "Inventory Management System - Login";
  return "Inventory Management System";
}

function Layout() {
const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  // 1. Wait for Auth to finish. This ensures we don't show the wrong page.
  if (loading) return null;

  // 2. UNAUTHENTICATED VIEW: No Sidebar, No Header.
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* If they try to go anywhere else while logged out, send to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. AUTHENTICATED VIEW: Full Dashboard.
  // If they are logged in and try to hit /login, bounce them to inventory.
  if (location.pathname === "/login") {
    return <Navigate to="/inventory/view" replace />;
  }

  return (
    <>
      <Header title={title} />
      <div className="app-body">
        <SideNav />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="product/view"
              element={
                <ProtectedRoute>
                  <ViewProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="category/view"
              element={
                <ProtectedRoute>
                  <ViewCategoriesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="productprice/view"
              element={
                <ProtectedRoute>
                  <ViewProductPricePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/view"
              element={
                <ProtectedRoute>
                  <ViewInventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/receive"
              element={
                <ProtectedRoute>
                  <ReceiveStockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/adjustment"
              element={
                <ProtectedRoute>
                  <StockAdjustmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/view"
              element={
                <ProtectedRoute>
                  <ViewOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/view"
              element={
                <ProtectedRoute>
                  <ViewCustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/salesreport"
              element={
                <ProtectedRoute>
                  <SalesReportPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="orders/refund"
              element={
                <ProtectedRoute>
                  <ViewRefundsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider theme={corporateTheme}>
          <Layout />
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
