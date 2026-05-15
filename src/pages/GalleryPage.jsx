import React from "react";
import { listActiveHomeSections } from "../api/resources.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function joinApiUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = String(path || "").trim();
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const baseForUploads = /^\/?api\/uploads\//i.test(normalizedPath)
    ? b.replace(/\/api$/i, "")
    : b;
  const p = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${baseForUploads}${p}`;
}

function resolveMediaUrl(rawUrl) {
  let url = String(rawUrl || "")
    .trim()
    .replace(/\\/g, "/");
  if (!url) return "";

  url = url
    .replace(/^\/?api\/uploads\//i, "/uploads/")
    .replace(/^(https?:\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/")
    .replace(/^(\/\/[^/]+)\/api\/uploads\//i, "$1/uploads/");

  if (/^(?:https?:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) return url;
  return joinApiUrl(API_BASE, url);
}

function getLocalizedValue(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.kn || "";
}

function normalizeAlbums(rawSections = [], language = "en", t) {
  return (Array.isArray(rawSections) ? rawSections : [])
    .filter((section) => section?.type === "gallery" && section?.active !== false)
    .map((section) => {
      const images = (Array.isArray(section?.slides) ? section.slides : [])
        .map((item, index) => ({
          id: item?._id || `${section._id || section.id || "gallery"}-img-${index}`,
          image: resolveMediaUrl(item?.image || ""),
          title: getLocalizedValue(item?.title, language),
          description: getLocalizedValue(item?.description, language),
          link: String(item?.link || "").trim(),
          order: Number(item?.order || index + 1),
        }))
        .filter((item) => item.image)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      return {
        id: section?._id || section?.id,
        title: getLocalizedValue(section?.title, language) || t("gallery.album_default"),
        description: getLocalizedValue(section?.blockContent, language),
        order: Number(section?.order || 0),
        images,
      };
    })
    .filter((album) => album.images.length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export default function GalleryPage() {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const [albums, setAlbums] = React.useState([]);
  const [activeAlbumId, setActiveAlbumId] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);

    listActiveHomeSections({ type: "gallery", limit: 200 })
      .then((data) => {
        if (!mounted) return;
        const normalized = normalizeAlbums(data, currentLanguage, t);
        setAlbums(normalized);
        setActiveAlbumId((prev) => {
          if (prev && normalized.some((album) => album.id === prev)) return prev;
          return normalized[0]?.id || "";
        });
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("Failed to load gallery:", error);
        setAlbums([]);
        setActiveAlbumId("");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentLanguage]);

  const selectedAlbum =
    albums.find((album) => album.id === activeAlbumId) || albums[0] || null;

  if (loading) {
    return (
      <section style={{ padding: "24px 16px" }}>
        <h2 style={{ margin: 0, fontSize: 28, color: "#111827" }}>{t("gallery.title")}</h2>
        <p style={{ color: "#6B7280", marginTop: 8 }}>{t("gallery.loading")}</p>
      </section>
    );
  }

  if (!selectedAlbum) {
    return (
      <section style={{ padding: "24px 16px" }}>
        <h2 style={{ margin: 0, fontSize: 28, color: "#111827" }}>{t("gallery.title")}</h2>
        <p style={{ color: "#6B7280", marginTop: 8 }}>
          {t("gallery.no_albums")}
        </p>
      </section>
    );
  }

  return (
    <section style={{ padding: "24px 16px 32px" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, fontSize: "clamp(26px, 3.5vw, 36px)", color: "#111827" }}>
          {t("gallery.title")}
        </h2>
        <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 15 }}>
          {t("gallery.explore")}
        </p>
      </div>

      {albums.length > 1 ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => setActiveAlbumId(album.id)}
              style={{
                border: "1px solid",
                borderColor: album.id === selectedAlbum.id ? "#2563EB" : "#D1D5DB",
                background: album.id === selectedAlbum.id ? "#EFF6FF" : "#FFFFFF",
                color: album.id === selectedAlbum.id ? "#1D4ED8" : "#374151",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {album.title} ({album.images.length})
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 22, color: "#111827" }}>
          {selectedAlbum.title}
        </h3>
        {selectedAlbum.description ? (
          <p style={{ margin: "8px 0 0", color: "#4B5563", lineHeight: 1.6 }}>
            {selectedAlbum.description}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {selectedAlbum.images.map((item, index) => {
          const destination = item.link || item.image;
          return (
            <a
              key={item.id || `${selectedAlbum.id}-${index}`}
              href={destination}
              target="_blank"
              rel="noreferrer"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
                background: "#FFFFFF",
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
              }}
            >
              <img
                src={item.image}
                alt={item.title || `Gallery image ${index + 1}`}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {item.title || item.description ? (
                <div style={{ padding: 10 }}>
                  {item.title ? (
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: 14,
                        marginBottom: item.description ? 4 : 0,
                      }}
                    >
                      {item.title}
                    </div>
                  ) : null}
                  {item.description ? (
                    <div style={{ color: "#6B7280", fontSize: 12, lineHeight: 1.5 }}>
                      {item.description}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
