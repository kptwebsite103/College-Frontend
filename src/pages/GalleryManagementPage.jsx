import React from "react";
import {
  listHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  listMedia,
} from "../api/resources.js";

function createImageRow(order = 1) {
  return {
    image: "",
    title_en: "",
    title_kn: "",
    link: "",
    order,
  };
}

function createInitialForm(order = 1) {
  return {
    title_en: "",
    title_kn: "",
    description_en: "",
    description_kn: "",
    order,
    active: true,
    images: [createImageRow(1)],
  };
}

function normalizeGalleryAlbum(section) {
  const slides = Array.isArray(section?.slides) ? section.slides : [];
  return {
    id: section?._id || section?.id,
    title_en: section?.title?.en || "",
    title_kn: section?.title?.kn || "",
    description_en: section?.blockContent?.en || "",
    description_kn: section?.blockContent?.kn || "",
    order: Number(section?.order || 0),
    active: section?.active !== false,
    images: slides
      .map((item, index) => ({
        image: String(item?.image || "").trim(),
        title_en: item?.title?.en || "",
        title_kn: item?.title?.kn || "",
        link: String(item?.link || "").trim(),
        order: Number(item?.order || index + 1),
      }))
      .filter((item) => item.image)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
  };
}

function normalizeMediaEntry(item = {}) {
  const url = String(item.url || item.secure_url || "").trim();
  if (!url) return null;
  return {
    id: item._id || item.id || url,
    title: item.title || item.filename || item.name || "Untitled",
    type: item.type || item.format || "",
    url,
    thumbnail: String(item.thumbnailUrl || item.thumbnail || url).trim(),
  };
}

function isImageMediaItem(item = {}) {
  if (!item?.url) return false;
  const type = String(item.type || "").toLowerCase();
  if (type === "image") return true;
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(item.url);
}

export default function GalleryManagementPage() {
  const [albums, setAlbums] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState("");
  const [formData, setFormData] = React.useState(createInitialForm(1));

  const [mediaItems, setMediaItems] = React.useState([]);
  const [mediaLoading, setMediaLoading] = React.useState(false);
  const [mediaError, setMediaError] = React.useState("");
  const [pickerImageIndex, setPickerImageIndex] = React.useState(null);

  const resetNotices = React.useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const loadAlbums = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listHomeSections({ type: "gallery", limit: 300 });
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeGalleryAlbum)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAlbums(normalized);
    } catch (err) {
      console.error("Failed to load gallery albums:", err);
      setError("Failed to load gallery albums.");
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const loadMediaLibrary = React.useCallback(async () => {
    setMediaLoading(true);
    setMediaError("");
    try {
      const data = await listMedia();
      const normalized = Array.isArray(data)
        ? data.map(normalizeMediaEntry).filter(Boolean).filter(isImageMediaItem)
        : [];
      setMediaItems(normalized);
    } catch (err) {
      console.error("Failed to load media for gallery picker:", err);
      setMediaItems([]);
      setMediaError("Failed to load media library.");
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const openCreateForm = () => {
    resetNotices();
    const nextOrder =
      albums.length > 0
        ? Math.max(...albums.map((album) => Number(album.order || 0))) + 1
        : 1;
    setEditingId("");
    setFormData(createInitialForm(nextOrder));
    setFormOpen(true);
  };

  const openEditForm = (album) => {
    resetNotices();
    setEditingId(album.id);
    setFormData({
      title_en: album.title_en || "",
      title_kn: album.title_kn || "",
      description_en: album.description_en || "",
      description_kn: album.description_kn || "",
      order: Number(album.order || 1),
      active: album.active !== false,
      images:
        album.images && album.images.length > 0
          ? album.images.map((img, index) => ({
              image: img.image || "",
              title_en: img.title_en || "",
              title_kn: img.title_kn || "",
              link: img.link || "",
              order: Number(img.order || index + 1),
            }))
          : [createImageRow(1)],
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId("");
    setFormData(createInitialForm(1));
    setPickerImageIndex(null);
  };

  const setAlbumField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setImageField = (index, field, value) => {
    setFormData((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, images };
    });
  };

  const addImageRow = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, createImageRow(prev.images.length + 1)],
    }));
  };

  const removeImageRow = (index) => {
    setFormData((prev) => {
      if (prev.images.length <= 1) return prev;
      const images = prev.images
        .filter((_, i) => i !== index)
        .map((row, idx) => ({ ...row, order: idx + 1 }));
      return { ...prev, images };
    });
  };

  const moveImageRow = (index, direction) => {
    setFormData((prev) => {
      const toIndex = index + direction;
      if (toIndex < 0 || toIndex >= prev.images.length) return prev;
      const images = [...prev.images];
      const [row] = images.splice(index, 1);
      images.splice(toIndex, 0, row);
      return {
        ...prev,
        images: images.map((item, idx) => ({ ...item, order: idx + 1 })),
      };
    });
  };

  const openImagePicker = async (imageIndex) => {
    setPickerImageIndex(imageIndex);
    if (mediaItems.length === 0 && !mediaLoading) {
      await loadMediaLibrary();
    }
  };

  const closeImagePicker = () => {
    setPickerImageIndex(null);
  };

  const selectImageFromMedia = (url) => {
    if (pickerImageIndex == null) return;
    setImageField(pickerImageIndex, "image", url);
    closeImagePicker();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetNotices();

    const titleEn = String(formData.title_en || "").trim();
    const titleKn = String(formData.title_kn || "").trim();
    if (!titleEn && !titleKn) {
      setError("Album name is required in at least one language.");
      return;
    }

    const cleanImages = (Array.isArray(formData.images) ? formData.images : [])
      .map((row, index) => ({
        image: String(row.image || "").trim(),
        title: {
          en: String(row.title_en || "").trim(),
          kn: String(row.title_kn || "").trim(),
        },
        link: String(row.link || "").trim(),
        order: index + 1,
      }))
      .filter((row) => row.image);

    if (cleanImages.length === 0) {
      setError("Add at least one photo to the album.");
      return;
    }

    const payload = {
      type: "gallery",
      title: {
        en: titleEn,
        kn: titleKn,
      },
      blockContent: {
        en: String(formData.description_en || "").trim(),
        kn: String(formData.description_kn || "").trim(),
      },
      order: Number(formData.order || 1),
      active: !!formData.active,
      slides: cleanImages,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateHomeSection(editingId, payload);
        setSuccess("Gallery album updated.");
      } else {
        await createHomeSection(payload);
        setSuccess("Gallery album created.");
      }
      await loadAlbums();
      closeForm();
    } catch (err) {
      console.error("Failed to save gallery album:", err);
      setError("Failed to save gallery album.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (album) => {
    if (!album?.id) return;
    const confirmed = window.confirm(
      `Delete album "${album.title_en || album.title_kn || "Untitled"}"?`,
    );
    if (!confirmed) return;
    resetNotices();
    try {
      await deleteHomeSection(album.id);
      setSuccess("Gallery album deleted.");
      await loadAlbums();
      if (editingId && editingId === album.id) {
        closeForm();
      }
    } catch (err) {
      console.error("Failed to delete gallery album:", err);
      setError("Failed to delete gallery album.");
    }
  };

  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, color: "#111827", fontSize: 24 }}>Gallery Management</h2>
          <p style={{ margin: "6px 0 0", color: "#6B7280", fontSize: 14 }}>
            Create albums, group photos, and control what appears in the public Gallery page.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
          style={{
            border: "none",
            borderRadius: 8,
            background: "#2563EB",
            color: "#FFFFFF",
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add Album
        </button>
      </div>

      {error ? (
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C", fontSize: 13 }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #86EFAC", background: "#F0FDF4", color: "#166534", fontSize: 13 }}>
          {success}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 20 }}>
        {loading ? (
          <div style={{ color: "#6B7280", fontSize: 14 }}>Loading albums...</div>
        ) : albums.length === 0 ? (
          <div style={{ color: "#6B7280", fontSize: 14 }}>No albums yet. Click "Add Album".</div>
        ) : (
          albums.map((album) => {
            const cover = album.images?.[0]?.image || "";
            return (
              <div
                key={album.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  background: "#FFFFFF",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div
                  style={{
                    height: 120,
                    background: cover
                      ? `url(${cover}) center/cover no-repeat`
                      : "linear-gradient(135deg, #DBEAFE, #E0F2FE)",
                  }}
                />
                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>
                      {album.title_en || album.title_kn || "Untitled Album"}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: album.active ? "#DCFCE7" : "#F3F4F6",
                        color: album.active ? "#166534" : "#4B5563",
                        fontWeight: 600,
                      }}
                    >
                      {album.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
                    {album.images.length} photos • Order {album.order || 0}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => openEditForm(album)}
                      style={{
                        border: "1px solid #D1D5DB",
                        borderRadius: 8,
                        background: "#FFFFFF",
                        color: "#374151",
                        fontSize: 12,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(album)}
                      style={{
                        border: "1px solid #FCA5A5",
                        borderRadius: 8,
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        fontSize: 12,
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            background: "#FFFFFF",
            padding: 16,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: "#111827", fontSize: 18 }}>
              {editingId ? "Edit Album" : "New Album"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              style={{
                border: "none",
                background: "transparent",
                color: "#6B7280",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Album Name (English)</div>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => setAlbumField("title_en", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Album Name (Kannada)</div>
              <input
                type="text"
                value={formData.title_kn}
                onChange={(e) => setAlbumField("title_kn", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Order</div>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setAlbumField("order", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setAlbumField("active", e.target.checked)}
              />
              <span style={{ fontSize: 13, color: "#374151" }}>Active on public gallery</span>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Description (English)</div>
              <textarea
                rows={3}
                value={formData.description_en}
                onChange={(e) => setAlbumField("description_en", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box", resize: "vertical" }}
              />
            </label>
            <label style={{ display: "block" }}>
              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Description (Kannada)</div>
              <textarea
                rows={3}
                value={formData.description_kn}
                onChange={(e) => setAlbumField("description_kn", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box", resize: "vertical" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600, color: "#111827" }}>Album Photos</div>
            <button
              type="button"
              onClick={addImageRow}
              style={{
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                background: "#F9FAFB",
                color: "#374151",
                fontSize: 12,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              + Add Photo
            </button>
          </div>

          {formData.images.map((row, index) => (
            <div
              key={`gallery-row-${index}`}
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                background: "#FCFCFD",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 13, color: "#1F2937" }}>Photo {index + 1}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => moveImageRow(index, -1)} disabled={index === 0} style={{ border: "1px solid #D1D5DB", background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: index === 0 ? "not-allowed" : "pointer" }}>↑</button>
                  <button type="button" onClick={() => moveImageRow(index, 1)} disabled={index === formData.images.length - 1} style={{ border: "1px solid #D1D5DB", background: "#fff", borderRadius: 6, padding: "2px 8px", cursor: index === formData.images.length - 1 ? "not-allowed" : "pointer" }}>↓</button>
                  <button type="button" onClick={() => removeImageRow(index)} disabled={formData.images.length <= 1} style={{ border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C", borderRadius: 6, padding: "2px 8px", cursor: formData.images.length <= 1 ? "not-allowed" : "pointer" }}>Remove</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={row.image}
                  onChange={(e) => setImageField(index, "image", e.target.value)}
                  placeholder="https://example.com/photo.jpg or /uploads/..."
                  style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => openImagePicker(index)}
                  style={{ border: "1px solid #D1D5DB", borderRadius: 8, background: "#FFFFFF", color: "#374151", fontSize: 12, padding: "8px 10px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Select from Media
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={row.title_en}
                  onChange={(e) => setImageField(index, "title_en", e.target.value)}
                  placeholder="Photo title (English)"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                />
                <input
                  type="text"
                  value={row.title_kn}
                  onChange={(e) => setImageField(index, "title_kn", e.target.value)}
                  placeholder="Photo title (Kannada)"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
                />
              </div>

              <input
                type="text"
                value={row.link}
                onChange={(e) => setImageField(index, "link", e.target.value)}
                placeholder="Optional redirect link/file for this photo"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #D1D5DB", boxSizing: "border-box" }}
              />

              {row.image ? (
                <img
                  src={row.image}
                  alt={`Preview ${index + 1}`}
                  style={{
                    marginTop: 8,
                    width: 120,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    background: "#F3F4F6",
                  }}
                />
              ) : null}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={closeForm}
              style={{
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                background: "#FFFFFF",
                color: "#374151",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                border: "none",
                borderRadius: 8,
                background: "#111827",
                color: "#FFFFFF",
                padding: "8px 14px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : editingId ? "Update Album" : "Create Album"}
            </button>
          </div>
        </form>
      ) : null}

      {pickerImageIndex != null ? (
        <div
          onClick={closeImagePicker}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2300,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(960px, 96vw)",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <strong style={{ color: "#111827" }}>Select Image From Media</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={loadMediaLibrary} disabled={mediaLoading} style={{ border: "1px solid #D1D5DB", borderRadius: 8, background: "#FFFFFF", color: "#374151", padding: "6px 10px", cursor: mediaLoading ? "not-allowed" : "pointer" }}>
                  Refresh
                </button>
                <button type="button" onClick={closeImagePicker} style={{ border: "1px solid #D1D5DB", borderRadius: 8, background: "#FFFFFF", color: "#374151", padding: "6px 10px", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>

            {mediaLoading ? (
              <div style={{ color: "#6B7280", fontSize: 14 }}>Loading media...</div>
            ) : mediaError ? (
              <div style={{ color: "#B91C1C", fontSize: 14 }}>{mediaError}</div>
            ) : mediaItems.length === 0 ? (
              <div style={{ color: "#6B7280", fontSize: 14 }}>
                No images found. Upload images from `/admin/media`.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {mediaItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectImageFromMedia(item.url)}
                    style={{
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                    }}
                  >
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.title}
                      style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                    />
                    <div style={{ padding: "8px 10px", fontSize: 12, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
