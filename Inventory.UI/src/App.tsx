import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./components/loginPage";
import ProtectedRoute from "./components/protectedRoute";
import SideNav from "./components/sideNav";
import  Header from "./components/header";
import 'bootstrap/dist/css/bootstrap.min.css';
import ViewProductsPage from "./components/viewProductsPage";
import { createTheme, ThemeProvider } from '@mui/material';

import './App.css'
import ViewCategoriesPage from "./components/viewCategoriesPage";
import ViewProductPricePage from "./components/viewProductPricePage";
import ViewInventoryPage from "./components/viewInventoryPage";

const corporateTheme = createTheme({
  typography: {
    fontFamily: '"arial", sans-serif',
    fontSize: 12,
    button: {
      textTransform: 'none', // Professional look: keeps buttons from being ALL CAPS
    },
  },
});

function getPageTitle(pathname: string) {
  if (pathname === "/category/view") return "Categories";
  if (pathname === "/category/add") return "Add Category";
  if (pathname === "/productprice/view") return "Product Prices";
  if (pathname === "/login") return "Inventory Application";
  return "Inventory Application";
}

function Layout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

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
                </ProtectedRoute>}/>
                
            <Route
              path="category/view"
              element={
                <ProtectedRoute>
                  <ViewCategoriesPage />
                </ProtectedRoute>}/>

              <Route
                path="productprice/view"
                element={
                  <ProtectedRoute>
                    <ViewProductPricePage />
                  </ProtectedRoute>}/>
              <Route
                path="inventory/view"
                element={
                  <ProtectedRoute>
                    <ViewInventoryPage />
                  </ProtectedRoute>}/>
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