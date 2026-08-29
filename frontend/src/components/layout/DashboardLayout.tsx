import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      label: "Instagram Accounts",
      path: "/instagram-accounts",
      icon: "◎",
    },
    {
      label: "Automations",
      path: "/automations",
      icon: "⚡",
    },
    {
      label: "Files",
      path: "/files",
      icon: "▣",
    },
    {
      label: "Settings",
      path: "/settings",
      icon: "⚙",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className={`app-shell ${darkMode ? "dark-theme" : ""}`}>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-mark">IA</div>

            <div>
              <h2>Instagram Auto DM</h2>
              <span>SaaS Platform</span>
            </div>

            <button
              className="mobile-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="nav-section-title">MAIN</div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? "nav-item-active" : ""
                  }`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">T</div>

            <div className="user-details">
              <strong>Test User</strong>
              <span>test@example.com</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

          <div className="powered-by">
            Powered By <strong>SwatPat Solutions</strong>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="topbar-title">
            <span>Workspace</span>
          </div>

          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <div className="topbar-user">
              <div className="user-avatar small">T</div>
              <span>Test User</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;