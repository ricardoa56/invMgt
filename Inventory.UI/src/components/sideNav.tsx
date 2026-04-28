import { useState } from "react"; // Added for toggle
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/SideNav.css";

function SideNav() {
  const { token } = useAuth();
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(true); // Keep open by default

  if (!token) return null;

  const isActive = (path: string) =>
    location.pathname === path ? " active" : "";

  return (
    <aside className="side-nav">
      <nav>
        <ul>
          <li>
            <Link
              className={`side-nav-link${isActive("/category/view")}`}
              to="/category/view"
            >
              Categories
            </Link>
          </li>
          <li>
            <Link
              className={`side-nav-link${isActive("/product/view")}`}
              to="/product/view"
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              className={`side-nav-link${isActive("/productprice/view")}`}
              to="/productprice/view"
            >
              Product Prices
            </Link>
          </li>

          {/* Inventory Parent Link */}
          <li>
            <div
              className="side-nav-link nav-parent"
              onClick={() => setInventoryOpen(!inventoryOpen)}
              style={{ cursor: "pointer" }}
            >
              Inventory
            </div>

            {inventoryOpen && (
              <ul className="side-nav-sub">
                <li>
                  <Link
                    className={`side-nav-link sub-link${isActive("/inventory/view")}`}
                    to="/inventory/view"
                  >
                    Stock Levels
                  </Link>
                </li>
                <li>
                  <Link
                    className={`side-nav-link sub-link${isActive("/inventory/receive")}`}
                    to="/inventory/receive"
                  >
                    Receive Stocks
                  </Link>
                </li>
                <li>
                  <Link
                    className={`side-nav-link sub-link${isActive("/inventory/adjustment")}`}
                    to="/inventory/adjustment"
                  >
                    Adjustment
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default SideNav;
