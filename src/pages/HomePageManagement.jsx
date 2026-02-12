import React, { useEffect, useState } from 'react';
import {
  listHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection
} from '../api/resources.js';

const sectionTypes = [
  { value: 'slider', label: 'Hero Carousel (Slides)' },
  { value: 'banner', label: 'Hero Banner' },
  { value: 'block', label: 'Custom HTML (Carousel)' }
];

const sampleCarouselHtml = `
<div class="hero-carousel">
  <div class="hero-slide">
    <div class="hero-slide-content">
      <h1>Welcome to Our College</h1>
      <p>Excellence in education and innovation.</p>
      <a class="hero-slide-cta" href="/admissions">Apply Now</a>
    </div>
  </div>
  <div class="hero-slide">
    <div class="hero-slide-content">
      <h1>Admissions Open</h1>
      <p>Join a community that shapes future leaders.</p>
      <a class="hero-slide-cta" href="/admissions">Start Here</a>
    </div>
  </div>
  <div class="hero-slide">
    <div class="hero-slide-content">
      <h1>Campus Life</h1>
      <p>Clubs, sports, and experiences that build character.</p>
      <a class="hero-slide-cta" href="/campus-life">Explore</a>
    </div>
  </div>
</div>
<style>
  .hero-carousel {
    position: relative;
    overflow: hidden;
    border-radius: 20px;
    min-height: 320px;
  }
  .hero-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 48px;
    color: #fff;
    background: linear-gradient(120deg, #1d4ed8, #0f172a);
    opacity: 0;
    animation: heroFade 15s infinite;
  }
  .hero-slide:nth-child(2) { animation-delay: 5s; }
  .hero-slide:nth-child(3) { animation-delay: 10s; }
  .hero-slide-content {
    max-width: 520px;
  }
  .hero-slide-cta {
    display: inline-block;
    margin-top: 12px;
    padding: 10px 18px;
    border-radius: 999px;
    background: #f97316;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
  }
  @keyframes heroFade {
    0% { opacity: 0; }
    8% { opacity: 1; }
    30% { opacity: 1; }
    38% { opacity: 0; }
    100% { opacity: 0; }
  }
</style>
`.trim();

function getTitle(section) {
  if (!section) return 'Untitled';
  return section.title?.en || section.title?.kn || 'Untitled';
}

export default function HomePageManagement() {
  const [sections, setSections] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(true);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const loadSections = async () => {
    setLoading(true);
    try {
      const data = await listHomeSections({ limit: 50 });
      const list = Array.isArray(data) ? data : [];
      const sorted = list.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
      setSections(sorted);
    } catch (error) {
      console.error('Failed to load home sections:', error);
      showNotification('error', 'Failed to load homepage sections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleAddSection = () => {
    setEditingSection(null);
    setShowAddForm(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setShowAddForm(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteHomeSection(sectionId);
      showNotification('success', 'Section deleted successfully.');
      loadSections();
    } catch (error) {
      console.error('Failed to delete section:', error);
      showNotification('error', 'Failed to delete section.');
    }
  };

  const handleSaveSection = async (sectionData) => {
    try {
      if (editingSection && editingSection._id) {
        await updateHomeSection(editingSection._id, sectionData);
        showNotification('success', 'Section updated successfully.');
      } else {
        await createHomeSection(sectionData);
        showNotification('success', 'Section added successfully.');
      }
      setShowAddForm(false);
      setEditingSection(null);
      loadSections();
    } catch (error) {
      console.error('Failed to save section:', error);
      showNotification('error', 'Failed to save section.');
    }
  };

  const handleToggleActive = async (section) => {
    if (!section?._id) return;
    const nextActive = !section.active;
    setSections((prev) =>
      prev.map((item) => (item._id === section._id ? { ...item, active: nextActive } : item))
    );
    try {
      await updateHomeSection(section._id, { active: nextActive });
    } catch (error) {
      console.error('Failed to toggle section:', error);
      showNotification('error', 'Failed to update section.');
      loadSections();
    }
  };

  const handleMoveSection = async (sectionId, direction) => {
    const index = sections.findIndex((section) => section._id === sectionId);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    const updated = reordered.map((sectionItem, idx) => ({
      ...sectionItem,
      order: idx + 1
    }));

    setSections(updated);

    try {
      await Promise.all([
        updateHomeSection(updated[index]._id, { order: updated[index].order }),
        updateHomeSection(updated[targetIndex]._id, { order: updated[targetIndex].order })
      ]);
    } catch (error) {
      console.error('Failed to reorder sections:', error);
      showNotification('error', 'Failed to reorder sections.');
      loadSections();
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'slider':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h10v2H7V9zm0 4h6v2H7v-2z" />
          </svg>
        );
      case 'banner':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z" />
          </svg>
        );
      case 'block':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981">
            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6B7280">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
        );
    }
  };

  if (showAddForm) {
    return (
      <AddEditSectionForm
        section={editingSection}
        sectionTypes={sectionTypes}
        onSave={handleSaveSection}
        onCancel={() => {
          setShowAddForm(false);
          setEditingSection(null);
        }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {notification.show ? (
        <div
          className="notification"
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 2000,
            background: notification.type === 'success' ? '#10B981' : '#EF4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {notification.message}
        </div>
      ) : null}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1F2937' }}>
          Homepage Management
        </h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '14px' }}>
          Manage homepage sections and their order
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '16px', color: '#6B7280' }}>Loading sections...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {sections.map((section, index) => (
            <div
              key={section._id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
                opacity: section.active ? '1' : '0.6'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getSectionIcon(section.type)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                      {getTitle(section)}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                      {sectionTypes.find((type) => type.value === section.type)?.label || 'Section'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleMoveSection(section._id, 'up')}
                    disabled={index === 0}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      opacity: index === 0 ? '0.3' : '1',
                      color: '#6B7280'
                    }}
                    title="Move Up"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveSection(section._id, 'down')}
                    disabled={index === sections.length - 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      opacity: index === sections.length - 1 ? '0.3' : '1',
                      color: '#6B7280'
                    }}
                    title="Move Down"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: section.active ? '#10B981' : '#6B7280',
                    color: 'white'
                  }}
                >
                  {section.active ? 'Active' : 'Inactive'}
                </span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Order: {section.order || index + 1}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleToggleActive(section)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {section.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleEditSection(section)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3B82F6',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSection(section._id)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#EF4444',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <div
            onClick={handleAddSection}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '2px dashed #D1D5DB',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = '#3B82F6';
              event.currentTarget.style.background = '#F0F7FF';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = '#D1D5DB';
              event.currentTarget.style.background = 'white';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#9CA3AF">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>Add New Section</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AddEditSectionForm({ section, sectionTypes, onSave, onCancel }) {
  const [language, setLanguage] = useState('en');
  const [formData, setFormData] = useState({
    type: section?.type || 'slider',
    title_en: section?.title?.en || '',
    title_kn: section?.title?.kn || '',
    order: section?.order || 1,
    active: section?.active !== false,
    bannerImage: section?.bannerImage || '',
    bannerDescription_en: section?.bannerDescription?.en || '',
    bannerDescription_kn: section?.bannerDescription?.kn || '',
    bannerLink: section?.bannerLink || '',
    blockContent_en: typeof section?.blockContent?.en === 'string' ? section.blockContent.en : '',
    blockContent_kn: typeof section?.blockContent?.kn === 'string' ? section.blockContent.kn : '',
    slides: Array.isArray(section?.slides) && section.slides.length > 0
      ? section.slides.map((slide, idx) => ({
          image: slide.image || '',
          link: slide.link || '',
          order: slide.order || idx + 1,
          title: {
            en: slide.title?.en || '',
            kn: slide.title?.kn || ''
          },
          description: {
            en: slide.description?.en || '',
            kn: slide.description?.kn || ''
          }
        }))
      : [
          {
            image: '',
            link: '',
            order: 1,
            title: { en: '', kn: '' },
            description: { en: '', kn: '' }
          }
        ]
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSlideChange = (index, field, value) => {
    setFormData((prev) => {
      const slides = prev.slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      );
      return { ...prev, slides };
    });
  };

  const handleSlideTextChange = (index, field, value) => {
    setFormData((prev) => {
      const slides = prev.slides.map((slide, slideIndex) => {
        if (slideIndex !== index) return slide;
        return {
          ...slide,
          [field]: {
            ...slide[field],
            [language]: value
          }
        };
      });
      return { ...prev, slides };
    });
  };

  const addSlide = () => {
    setFormData((prev) => ({
      ...prev,
      slides: [
        ...prev.slides,
        {
          image: '',
          link: '',
          order: prev.slides.length + 1,
          title: { en: '', kn: '' },
          description: { en: '', kn: '' }
        }
      ]
    }));
  };

  const removeSlide = (index) => {
    setFormData((prev) => {
      if (prev.slides.length <= 1) return prev;
      const slides = prev.slides.filter((_, slideIndex) => slideIndex !== index);
      return {
        ...prev,
        slides: slides.map((slide, slideIndex) => ({ ...slide, order: slideIndex + 1 }))
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      type: formData.type,
      title: {
        en: formData.title_en,
        kn: formData.title_kn
      },
      active: formData.active,
      order: Number(formData.order) || 1
    };

    if (formData.type === 'banner') {
      payload.bannerImage = formData.bannerImage;
      payload.bannerDescription = {
        en: formData.bannerDescription_en,
        kn: formData.bannerDescription_kn
      };
      if (formData.bannerLink) payload.bannerLink = formData.bannerLink;
    }

    if (formData.type === 'slider') {
      payload.slides = formData.slides.map((slide, index) => ({
        image: slide.image,
        link: slide.link,
        order: Number(slide.order) || index + 1,
        title: {
          en: slide.title?.en || '',
          kn: slide.title?.kn || ''
        },
        description: {
          en: slide.description?.en || '',
          kn: slide.description?.kn || ''
        }
      }));
    }

    if (formData.type === 'block') {
      payload.blockContent = {
        en: formData.blockContent_en,
        kn: formData.blockContent_kn
      };
    }

    onSave(payload);
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
          {section ? 'Edit Section' : 'Add New Section'}
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: 0,
            lineHeight: 1
          }}
        >
          X
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
        <button
          onClick={() => setLanguage('en')}
          style={{
            flex: 1,
            padding: '14px 20px',
            border: 'none',
            borderBottom: language === 'en' ? '2px solid #3B82F6' : '2px solid transparent',
            background: language === 'en' ? '#F0F7FF' : 'transparent',
            color: language === 'en' ? '#3B82F6' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('kn')}
          style={{
            flex: 1,
            padding: '14px 20px',
            border: 'none',
            borderBottom: language === 'kn' ? '2px solid #3B82F6' : '2px solid transparent',
            background: language === 'kn' ? '#F0F7FF' : 'transparent',
            color: language === 'kn' ? '#3B82F6' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Kannada
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
            Section Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              background: 'white'
            }}
          >
            {sectionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
            Title ({language === 'en' ? 'English' : 'Kannada'})
          </label>
          <input
            type="text"
            name={language === 'en' ? 'title_en' : 'title_kn'}
            value={language === 'en' ? formData.title_en : formData.title_kn}
            onChange={handleChange}
            placeholder="Enter section title"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: language === 'kn' ? '16px' : '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {formData.type === 'banner' ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Banner Image URL
              </label>
              <input
                type="url"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={handleChange}
                placeholder="https://example.com/hero.jpg"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Banner Description ({language === 'en' ? 'English' : 'Kannada'})
              </label>
              <textarea
                name={language === 'en' ? 'bannerDescription_en' : 'bannerDescription_kn'}
                value={language === 'en' ? formData.bannerDescription_en : formData.bannerDescription_kn}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the banner"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: language === 'kn' ? '16px' : '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Banner Link (optional)
              </label>
              <input
                type="url"
                name="bannerLink"
                value={formData.bannerLink}
                onChange={handleChange}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </>
        ) : null}

        {formData.type === 'slider' ? (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Carousel Slides</label>
              <button
                type="button"
                onClick={addSlide}
                style={{
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Add Slide
              </button>
            </div>
            {formData.slides.map((slide, index) => (
              <div
                key={`slide-${index}`}
                style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <strong>Slide {index + 1}</strong>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#EF4444',
                      cursor: formData.slides.length <= 1 ? 'not-allowed' : 'pointer'
                    }}
                    disabled={formData.slides.length <= 1}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Image URL</label>
                  <input
                    type="url"
                    value={slide.image}
                    onChange={(event) => handleSlideChange(index, 'image', event.target.value)}
                    placeholder="https://example.com/slide.jpg"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
                    Slide Title ({language === 'en' ? 'English' : 'Kannada'})
                  </label>
                  <input
                    type="text"
                    value={language === 'en' ? slide.title.en : slide.title.kn}
                    onChange={(event) => handleSlideTextChange(index, 'title', event.target.value)}
                    placeholder="Slide title"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
                    Slide Description ({language === 'en' ? 'English' : 'Kannada'})
                  </label>
                  <textarea
                    rows={3}
                    value={language === 'en' ? slide.description.en : slide.description.kn}
                    onChange={(event) => handleSlideTextChange(index, 'description', event.target.value)}
                    placeholder="Slide description"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Slide Link (optional)</label>
                  <input
                    type="url"
                    value={slide.link}
                    onChange={(event) => handleSlideChange(index, 'link', event.target.value)}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>Order</label>
                  <input
                    type="number"
                    value={slide.order}
                    onChange={(event) => handleSlideChange(index, 'order', event.target.value)}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {formData.type === 'block' ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Carousel HTML ({language === 'en' ? 'English' : 'Kannada'})
            </label>
            <textarea
              name={language === 'en' ? 'blockContent_en' : 'blockContent_kn'}
              value={language === 'en' ? formData.blockContent_en : formData.blockContent_kn}
              onChange={handleChange}
              rows={10}
              placeholder="Paste carousel HTML here"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: language === 'kn' ? '16px' : '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                Tip: Include any CSS inside a &lt;style&gt; tag for the carousel.
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    [language === 'en' ? 'blockContent_en' : 'blockContent_kn']: sampleCarouselHtml
                  }))
                }
                style={{
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  background: '#F9FAFB',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Use Sample Carousel HTML
              </button>
            </div>
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Display Order
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min="1"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#374151',
                fontSize: '14px'
              }}
            >
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              Active
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 24px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {section ? 'Update Section' : 'Add Section'}
          </button>
        </div>
      </form>
    </div>
  );
}
