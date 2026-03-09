import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listMenus,
  getTheme,
  updateTheme,
  updateMenu,
  createMenu,
} from "../api/resources.js";
import { usePermissions } from "../utils/rolePermissions";
import "./UserManagementContent.css";

export default function FooterSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [footerContact, setFooterContact] = useState({
    address: "Mangalore, Karnataka 575001",
    phone: "+91 1234567890",
    email: "info@kptmangalore.edu",
    description:
      "Excellence in Education since 1985. Providing quality education and fostering holistic development for students.",
  });
  const [footerQuickLinks, setFooterQuickLinks] = useState([]);
  const [menus, setMenus] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });

  useEffect(() => {
    const loadTheme = async () => {
      try {
        getTheme("footer_contact")
          .then((theme) => {
            if (theme && theme.contact) {
              setFooterContact(theme.contact);
            }
          })
          .catch((err) =>
            console.error("Error loading footer_contact theme:", err),
          );
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Load menus from database for Quick Links selector
    listMenus()
      .then((apiMenus) => {
        if (apiMenus && apiMenus.length > 0) {
          setMenus(apiMenus);
          const footerLinksMenu = apiMenus.find(
            (m) => m.slug === "footer-quick-links",
          );
          if (footerLinksMenu && footerLinksMenu.items) {
            setFooterQuickLinks(
              footerLinksMenu.items.map(
                (item) => item.url || item.redirect_url,
              ),
            );
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  const flatten = (mList) => {
    const flat = [];
    mList.forEach((m) => {
      flat.push(m);
      if (m.items) flat.push(...flatten(m.items));
      if (m.children) flat.push(...flatten(m.children));
    });
    return flat;
  };

  const handleSaveFooterSettings = async () => {
    setLoading(true);
    try {
      await updateTheme("footer_contact", {
        type: "footer_contact",
        contact: footerContact,
      });

      const flatMenus = flatten(menus);

      // Make sure we have the full items for the selected URLs
      const selectedItems = footerQuickLinks
        .map((url, index) => {
          const m = flatMenus.find(
            (x) => x.url === url || x.redirect_url === url,
          );
          if (!m) return null;
          return {
            title: m.title || { en: m.name?.en || m.menu_name_en },
            url: m.url || "",
            redirect_url: m.redirect_url || "",
            status: "Approved",
            order: index,
            items: [],
          };
        })
        .filter(Boolean);

      let footerMenu = menus.find((m) => m.slug === "footer-quick-links");
      if (footerMenu) {
        await updateMenu(footerMenu._id || footerMenu.id, {
          items: selectedItems,
          active: true,
          type: "footer",
        });
      } else {
        await createMenu({
          name: { en: "Footer Quick Links", kn: "" },
          slug: "footer-quick-links",
          type: "footer",
          status: "Approved",
          active: true,
          order: 0,
          items: selectedItems,
        });
      }

      showNotification("success", "Footer settings saved successfully!");
      window.dispatchEvent(new CustomEvent("footerSettingsUpdated"));
    } catch (e) {
      console.error(e);
      showNotification("error", "Failed to save footer settings");
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="card" style={{ padding: "20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "20px", marginBottom: "20px" }}>
          Footer Settings
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Description:
            </label>
            <textarea
              value={footerContact.description}
              onChange={(e) =>
                setFooterContact({
                  ...footerContact,
                  description: e.target.value,
                })
              }
              className="form-control"
              rows={3}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Address:
            </label>
            <input
              type="text"
              value={footerContact.address}
              onChange={(e) =>
                setFooterContact({ ...footerContact, address: e.target.value })
              }
              className="form-control"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Phone:
            </label>
            <input
              type="text"
              value={footerContact.phone}
              onChange={(e) =>
                setFooterContact({ ...footerContact, phone: e.target.value })
              }
              className="form-control"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Email:
            </label>
            <input
              type="text"
              value={footerContact.email}
              onChange={(e) =>
                setFooterContact({ ...footerContact, email: e.target.value })
              }
              className="form-control"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Quick Links (Select from existing Navbars):
            </label>
            <div
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "12px",
                maxHeight: "200px",
                overflowY: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                justifyContent: "flex-start",
              }}
            >
              {(() => {
                const flatMenus = flatten(menus).filter(
                  (m) =>
                    m.status === "Approved" &&
                    m.type !== "footer" &&
                    m.slug !== "footer-social-links" &&
                    (m.url || m.redirect_url) &&
                    m.url !== "#",
                );
                const uniqueMenus = [];
                flatMenus.forEach((fm) => {
                  const fmUrl = fm.url || fm.redirect_url;
                  if (
                    !uniqueMenus.find(
                      (u) => (u.url || u.redirect_url) === fmUrl,
                    )
                  ) {
                    uniqueMenus.push(fm);
                  }
                });

                if (uniqueMenus.length === 0)
                  return (
                    <div style={{ color: "#6b7280", width: "100%" }}>
                      No valid links found in Navbars.
                    </div>
                  );

                return uniqueMenus.map((m, idx) => {
                  const mUrl = m.url || m.redirect_url;
                  return (
                    <div
                      key={idx}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          margin: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={footerQuickLinks.includes(mUrl)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFooterQuickLinks([...footerQuickLinks, mUrl]);
                            } else {
                              setFooterQuickLinks(
                                footerQuickLinks.filter((url) => url !== mUrl),
                              );
                            }
                          }}
                        />
                        <span>
                          {m.title?.en || m.name?.en || m.menu_name_en} ({mUrl})
                        </span>
                      </label>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={handleSaveFooterSettings}
            disabled={loading}
            style={{
              padding: "10px 20px",
              border: "1px solid #3b82f6",
              backgroundColor: "#3b82f6",
              color: "white",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Saving..." : "Save Footer Settings"}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-message">
              {notification.type === "success" ? "✓" : "✗"}{" "}
              {notification.message}
            </span>
            <button
              className="notification-close"
              onClick={() =>
                setNotification({ show: false, type: "", message: "" })
              }
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
