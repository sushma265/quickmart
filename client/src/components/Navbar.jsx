import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the account menu when clicking elsewhere
  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">Q</span>
          <span className="logo-text">QuickMart</span>
        </Link>

        <nav className="nav-actions">
          {user ? (
            <div className="account" ref={menuRef}>
              <button className="account-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="account-name">{user.name.split(' ')[0]}</span>
                <span className="caret">▾</span>
              </button>
              {open && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <NavLink to="/my-ads" onClick={() => setOpen(false)}>
                    My ads
                  </NavLink>
                  <NavLink to="/post" onClick={() => setOpen(false)}>
                    Post a new ad
                  </NavLink>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log in
              </Link>
              <Link to="/register" className="nav-link hide-sm">
                Sign up
              </Link>
            </>
          )}
          <Link to="/post" className="btn btn-accent sell-btn">
            <span className="plus">+</span> Sell
          </Link>
        </nav>
      </div>
    </header>
  );
}
