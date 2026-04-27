import '../App.css'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Header({ title }: { title: string; }) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-title">{title}</div>
      <nav className="header-nav">
        <a href="#">Dashboard</a>
        <a href="#">Settings</a>
        {token && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header