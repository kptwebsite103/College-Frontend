import React, { useState, useEffect } from 'react';
import ImageKitUpload from './ImageKitUpload';
import './ImageKitUpload.css';

const ImageKitUploadManager = ({ 
  initialFiles = [],
  onFilesChange,
  maxFiles = 10,
  folder = 'college-files'
}) => {
  const [files, setFiles] = useState(initialFiles);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const handleUploadSuccess = (newFile) => {
    setFiles(prev => {
      const updatedFiles = [...prev, newFile];
      onFilesChange?.(updatedFiles);
      return updatedFiles;
    });
    setError(null);
    setUploadProgress(0);
  };

  const handleUploadError = (error) => {
    setError(error.message || 'Upload failed');
    setUploadProgress(0);
  };

  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(file => file.fileId !== fileId);
      onFilesChange?.(updatedFiles);
      return updatedFiles;
    });
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChange?.([]);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="upload-manager">
      <div className="upload-header">
        <h3>File Upload Manager</h3>
        {files.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={clearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="dismiss-error"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {uploadProgress > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}

      <div className="upload-stats">
        <span>Files: {files.length}/{maxFiles}</span>
        {files.length > 0 && (
          <span>
            Total Size: {(files.reduce((acc, file) => acc + (file.size || 0), 0) / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </div>

      {files.length < maxFiles && (
        <ImageKitUpload
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
          onProgress={handleUploadProgress}
          folder={folder}
          buttonText="Add Files"
          showPreview={false}
        />
      )}

      {files.length > 0 && (
        <div className="files-list">
          <h4>Uploaded Files:</h4>
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.fileId} className="file-item">
                <div className="file-preview">
                  {file.fileType === 'image' ? (
                    <img 
                      src={file.thumbnailUrl || file.url}
                      alt={file.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="file-icon">
                      {file.fileType === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                </div>
                <div className="file-info">
                  <p className="file-name" title={file.name}>
                    {file.name}
                  </p>
                  <p className="file-size">
                    {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                  </p>
                  <div className="file-actions">
                    <a 
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-btn"
                    >
                      View
                    </a>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFile(file.fileId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageKitUploadManager;
