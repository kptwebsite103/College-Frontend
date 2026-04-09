import React, { useEffect, useState } from "react";
import TopHeader from "./TopHeader/TopHeader";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../utils/rolePermissions";

export default function Layout({ children }) {
  const nav = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const { highestRole, permissions, isSuperAdmin } = usePermissions();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Add class to body to remove padding on admin pages
    document.body.classList.add("admin-page");

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove("admin-page");
    };
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      nav("/");
    }
  };
  const toggleSidebar = () => setMobileSidebarOpen((prev) => !prev);
  const closeSidebar = () => setMobileSidebarOpen(false);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <TopHeader />
      <div className="app-shell">
        <aside className={`sidebar${mobileSidebarOpen ? " is-open" : ""}`}>
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">
              {(() => {
                const userRole =
                  currentUser?.roles?.[0]?.toLowerCase() || "admin";
                const avatarPath =
                  userRole === "super-admin" ||
                  userRole === "admin" ||
                  userRole === "creator"
                    ? `/avatars/${userRole}.jpeg`
                    : `/avatars/${userRole}.png`;

                try {
                  return (
                    <img
                      src={avatarPath}
                      alt={`${userRole} avatar`}
                      onError={(e) => {
                        // Fallback to initials if image doesn't exist
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  );
                } catch (error) {
                  return null;
                }
              })()}
              <div
                style={{
                  display: "none",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                {currentUser &&
                (currentUser.firstName ||
                  currentUser.lastName ||
                  currentUser.username ||
                  currentUser.email)
                  ? String(
                      currentUser.firstName ||
                        currentUser.lastName ||
                        currentUser.username ||
                        currentUser.email,
                    )
                      .slice(0, 1)
                      .toUpperCase()
                  : "A"}
              </div>
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-profile-name">
                {currentUser?.firstName ||
                  currentUser?.lastName ||
                  currentUser?.username ||
                  currentUser?.email ||
                  "Admin"}
              </div>
              <div className="sidebar-profile-email">
                {currentUser?.email || "admin@kpt.edu"}
              </div>
              <div className="sidebar-profile-role">
                {isSignedIn && currentUser?.roles?.length > 0
                  ? currentUser.roles
                      .map(
                        (role) => role.charAt(0).toUpperCase() + role.slice(1),
                      )
                      .join(", ")
                  : isSignedIn
                    ? "Administrator"
                    : "Guest"}
              </div>
            </div>
          </div>

          <nav className="sidebar-nav" onClick={closeSidebar}>
            <div className="sidebar-section-title">{t("admin.main_menu")}</div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              {t("admin.dashboard")}
            </NavLink>

            {/* Show homepage management for all admin roles */}
            <NavLink
              to="/admin/homepage"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              {t("admin.homepage")}
            </NavLink>

            {/* Show navbar management for creators and above */}
            {(permissions.canCreateItems || permissions.canEditAllItems) && (
              <>
                <NavLink
                  to="/admin/menus"
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  {t("admin.navbar")}
                </NavLink>
                <NavLink
                  to="/admin/footer"
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  Footer Settings
                </NavLink>
              </>
            )}

            {/* Show pages management for creators and above */}
            {(permissions.canCreateItems || permissions.canEditAllItems) && (
              <>
                <NavLink
                  to="/admin/pages"
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  {t("admin.pages")}
                </NavLink>
                <NavLink
                  to="/admin/pages?mode=announcement"
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  Notices
                </NavLink>
                <NavLink
                  to="/admin/gallery"
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  Gallery Management
                </NavLink>
              </>
            )}
          </nav>

          <div className="sidebar-actions"></div>
        </aside>
        <button
          type="button"
          className={`sidebar-overlay${mobileSidebarOpen ? " is-open" : ""}`}
          onClick={closeSidebar}
          aria-label="Close menu"
        />

        <div className="main">
          <div className="topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="sidebar-toggle"
                aria-label="Toggle menu"
                aria-expanded={mobileSidebarOpen}
                onClick={toggleSidebar}
              >
                <span />
                <span />
                <span />
              </button>
              <NavLink
                to="/admin/media"
                className={({ isActive }) =>
                  `topbar-pill${isActive ? " active" : ""}`
                }
              >
                {t("topbar.media")}
              </NavLink>
              <NavLink
                to="/admin/menus"
                className={({ isActive }) =>
                  `topbar-pill${isActive ? " active" : ""}`
                }
              >
                {t("topbar.home_page_sections")}
              </NavLink>
            </div>
            <div className="topbar-right">
              <button className="topbar-visit" onClick={() => nav("/")}>
                Visit Site
              </button>
            </div>
          </div>

          <main className="main-content">{children}</main>
        </div>
      </div>
    </>
  );
}
