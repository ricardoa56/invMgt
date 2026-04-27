import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/SideNav.css";

function SideNav() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return null;
  }

  return (
    <aside className="side-nav">
      <nav>
        <ul>
          <li>
            {/* 2. Remove 'typeof' - just use Link */}
            <Link
              className={`side-nav-link${location.pathname === "/category/view" ? " active" : ""}`}
              to="/category/view"
            >
              Categories
            </Link>
          </li>
          {/* <li>
            <Link className={`side-nav-link${location.pathname === "/uom/view" ? " active" : ""}`} to="/uom/view" >
              Unit Of Measurement
            </Link>
          </li> */}
          <li>
            <Link
              className={`side-nav-link${location.pathname === "/product/view" ? " active" : ""}`}
              to="/product/view"
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              className={`side-nav-link${location.pathname === "/productprice/view" ? " active" : ""}`}
              to="/productprice/view"
            >
              Product Prices
            </Link>
          </li>
          <li>
            <Link
              className={`side-nav-link${location.pathname === "/inventory/view" ? " active" : ""}`}
              to="/inventory/view"
            >
              Inventory
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default SideNav;
