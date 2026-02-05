import React, { useState, useCallback } from 'react';
import { IKImage, IKContext, IKUpload } from 'imagekitio-react';
import './ImageKitUpload.css';

const ImageKitUpload = ({ 
  onSuccess, 
  onError, 
  onProgress,
  folder = 'college-files',
  accept = '*/*',
  multiple = false,
  maxFiles = 10,
  buttonText = 'Upload Files',
  showPreview = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
  const authenticationEndpoint = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/upload/auth-params`;

  if (!publicKey || !urlEndpoint) {
    return (
      <div className="imagekit-error">
        <p>ImageKit configuration missing. Please check environment variables.</p>
      </div>
    );
  }

  const handleUploadStart = useCallback(() => {
    setUploading(true);
    onProgress?.(0);
  }, [onProgress]);

  const handleUploadProgress = useCallback((progress) => {
    onProgress?.(progress);
  }, [onProgress]);

  const handleUploadSuccess = useCallback((response) => {
    const newFile = {
      fileId: response.fileId,
      name: response.name,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      size: response.size,
      fileType: response.fileType
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    setUploading(false);
    onSuccess?.(newFile);
  }, [onSuccess]);

  const handleUploadError = useCallback((error) => {
    setUploading(false);
    onError?.(error);
    console.error('Upload error:', error);
  }, [onError]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      // Handle the dropped files
      files.forEach(file => {
        // You can add additional validation here
        console.log('Dropped file:', file.name);
      });
    }
  }, []);

  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.fileId !== fileId));
  }, []);

  return (
    <div className="imagekit-upload-container">
      <IKContext
        publicKey={publicKey}
        urlEndpoint={urlEndpoint}
        authenticationEndpoint={authenticationEndpoint}
      >
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <IKUpload
            fileName={folder + "-${file.name}"}
            tags={[folder]}
            folder={folder}
            isPrivateFile={false}
            useUniqueFileName={true}
            responseFields={["tags"]}
            onError={handleUploadError}
            onSuccess={handleUploadSuccess}
            onUploadStart={handleUploadStart}
            onUploadProgress={handleUploadProgress}
            accept={accept}
            multiple={multiple}
            style={{ display: 'none' }}
            id="file-upload"
          />
          
          <label htmlFor="file-upload" className="upload-button">
            {uploading ? (
              <span className="uploading-text">Uploading...</span>
            ) : (
              <span>{buttonText}</span>
            )}
          </label>
          
          <p className="upload-hint">
            Drag and drop files here or click to browse
          </p>
          
          <p className="file-types">
            Supported: Images, Videos, Documents (Max 50MB)
          </p>
        </div>
      </IKContext>

      {showPreview && uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files:</h4>
          <div className="files-grid">
            {uploadedFiles.map((file) => (
              <div key={file.fileId} className="file-item">
                <div className="file-preview">
                  {file.fileType === 'image' ? (
                    <IKImage
                      src={file.url}
                      alt={file.name}
                      transformation={[{
                        height: 100,
                        width: 100,
                        crop: 'at_max'
                      }]}
                      loading="lazy"
                    />
                  ) : (
                    <div className="file-icon">
                      {file.fileType === 'video' ? '🎥' : '📄'}
                    </div>
                  )}
                </div>
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFile(file.fileId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageKitUpload;
