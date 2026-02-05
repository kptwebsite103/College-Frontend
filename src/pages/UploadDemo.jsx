import React, { useState } from 'react';
import { ImageKitUpload, ImageKitUploadManager } from '../components/ImageKitUpload';
import './UploadDemo.css';

const UploadDemo = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('single');

  const handleFilesChange = (files) => {
    setUploadedFiles(files);
  };

  const handleSingleUploadSuccess = (file) => {
    console.log('Single upload successful:', file);
  };

  const handleSingleUploadError = (error) => {
    console.error('Single upload error:', error);
  };

  const handleSingleUploadProgress = (progress) => {
    console.log('Upload progress:', progress);
  };

  return (
    <div className="upload-demo">
      <div className="demo-header">
        <h1>ImageKit Upload Demo</h1>
        <p>Test file uploads for images, videos, and documents</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Upload
        </button>
        <button 
          className={`tab-button ${activeTab === 'manager' ? 'active' : ''}`}
          onClick={() => setActiveTab('manager')}
        >
          Upload Manager
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'single' && (
          <div className="single-upload-section">
            <h2>Single File Upload</h2>
            <ImageKitUpload
              onSuccess={handleSingleUploadSuccess}
              onError={handleSingleUploadError}
              onProgress={handleSingleUploadProgress}
              folder="demo-uploads"
              buttonText="Choose File to Upload"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              showPreview={true}
            />
          </div>
        )}

        {activeTab === 'manager' && (
          <div className="manager-upload-section">
            <h2>Upload Manager</h2>
            <ImageKitUploadManager
              initialFiles={uploadedFiles}
              onFilesChange={handleFilesChange}
              maxFiles={10}
              folder="demo-uploads"
            />
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-summary">
          <h3>Current Files ({uploadedFiles.length})</h3>
          <div className="files-list">
            {uploadedFiles.map((file) => (
              <div key={file.fileId} className="file-summary">
                <span className="file-name">{file.name}</span>
                <span className="file-type">{file.fileType}</span>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-link">
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDemo;
