import React, { useState } from 'react';

export default function HomePageManagement() {
  const [sections, setSections] = useState([
    {
      id: '1',
      type: 'hero',
      title: 'Welcome Banner',
      content: { en: 'Welcome to Our College', kn: 'ನಮ್ಮ ಕಾಲೇಜಿಗೆ ಸ್ವಾಗತ' },
      image: 'https://example.com/hero.jpg',
      order: 1,
      active: true
    },
    {
      id: '2',
      type: 'announcement',
      title: 'Latest Announcements',
      content: { en: 'Check our latest news and updates', kn: 'ನಮ್ಮ ಇತ್ತೀಚಿನ ಸುದ್ದಿ ಮತ್ತು ನವೀಕರಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ' },
      order: 2,
      active: true
    },
    {
      id: '3',
      type: 'gallery',
      title: 'Photo Gallery',
      content: { en: 'Campus photos', kn: 'ಕ್ಯಾಂಪಸ್ ಫೋಟೋಗಳು' },
      order: 3,
      active: true
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [language, setLanguage] = useState('en');

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const sectionTypes = [
    { value: 'hero', label: 'Hero Banner' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'gallery', label: 'Photo Gallery' },
    { value: 'features', label: 'Features Section' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'cta', label: 'Call to Action' },
    { value: 'custom', label: 'Custom HTML' }
  ];

  const handleAddSection = () => {
    setEditingSection(null);
    setShowAddForm(true);
  };

  const handleEditSection = (section) => {
    setEditingSection({ ...section });
    setShowAddForm(true);
  };

  const handleDeleteSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setSections(sections.filter(s => s.id !== sectionId));
      showNotification('success', 'Section deleted successfully!');
    }
  };

  const handleSaveSection = (sectionData) => {
    if (editingSection) {
      setSections(sections.map(s => s.id === editingSection.id ? { ...sectionData, id: s.id } : s));
      showNotification('success', 'Section updated successfully!');
    } else {
      const newSection = { ...sectionData, id: Date.now().toString() };
      setSections([...sections, newSection]);
      showNotification('success', 'Section added successfully!');
    }
    setShowAddForm(false);
    setEditingSection(null);
  };

  const handleToggleActive = (sectionId) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, active: !s.active } : s
    ));
  };

  const handleMoveSection = (sectionId, direction) => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'hero':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z"/>
          </svg>
        );
      case 'announcement':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
        );
      case 'gallery':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#6B7280">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
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
      {/* Notification */}
      {notification.show && (
        <div className="notification" style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 2000,
          background: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1F2937' }}>Homepage Management</h1>
        <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '14px' }}>
          Manage homepage sections and their order
        </p>
      </div>

      {/* Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {sections.map((section, index) => (
          <div
            key={section.id}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getSectionIcon(section.type)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {section.title}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                    {sectionTypes.find(t => t.value === section.type)?.label}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleMoveSection(section.id, 'up')}
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
                    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveSection(section.id, 'down')}
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
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600',
                background: section.active ? '#10B981' : '#6B7280',
                color: 'white'
              }}>
                {section.active ? 'Active' : 'Inactive'}
              </span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                Order: {section.order}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleToggleActive(section.id)}
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
                onClick={() => handleDeleteSection(section.id)}
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

        {/* Add New Section Card */}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.background = '#F0F7FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.background = 'white';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#9CA3AF">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280' }}>
            Add New Section
          </span>
        </div>
      </div>
    </div>
  );
}

function AddEditSectionForm({ section, sectionTypes, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: section?.type || 'hero',
    title: section?.title || '',
    title_kn: section?.title_kn || '',
    content_en: section?.content?.en || '',
    content_kn: section?.content?.kn || '',
    image: section?.image || '',
    order: section?.order || 1,
    active: section?.active !== false
  });
  const [language, setLanguage] = useState('en');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sectionData = {
      type: formData.type,
      title: formData.title,
      title_kn: formData.title_kn,
      content: {
        en: formData.content_en,
        kn: formData.content_kn
      },
      image: formData.image,
      order: parseInt(formData.order),
      active: formData.active
    };
    onSave(sectionData);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
          {section ? 'Edit Section' : 'Add New Section'}
        </h3>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9CA3AF',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>

      {/* Language Switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        background: '#FFFFFF'
      }}>
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

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        {/* Section Type */}
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
            {sectionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
            Title ({language === 'en' ? 'English' : 'Kannada'})
          </label>
          <input
            type="text"
            name={language === 'en' ? 'title' : 'title_kn'}
            value={language === 'en' ? formData.title : formData.title_kn}
            onChange={handleChange}
            placeholder={language === 'en' ? 'Enter title in English' : 'ಕನ್ನಡದಲ್ಲಿ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ'}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: language === 'kn' ? '16px' : '14px',
              boxSizing: 'border-box',
              fontFamily: language === 'kn' ? 'serif' : 'inherit'
            }}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
            Content ({language === 'en' ? 'English' : 'Kannada'})
          </label>
          <textarea
            name={language === 'en' ? 'content_en' : 'content_kn'}
            value={language === 'en' ? formData.content_en : formData.content_kn}
            onChange={handleChange}
            rows={6}
            placeholder={language === 'en' ? 'Enter content in English' : 'ಕನ್ನಡದಲ್ಲಿ ವಿಷಯವನ್ನು ನಮೂದಿಸಿ'}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: language === 'kn' ? '16px' : '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: language === 'kn' ? 'serif' : 'inherit'
            }}
          />
        </div>

        {/* Image URL */}
        {formData.type === 'hero' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
              Hero Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
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
        )}

        {/* Order and Active */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
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
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
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

        {/* Action Buttons */}
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
