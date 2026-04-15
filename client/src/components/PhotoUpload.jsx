import { useState, useRef } from 'react';
import { uploadExpertPhoto } from '../api/experts';

const PhotoUpload = ({ profileId, currentPhoto, onUploadSuccess }) => {
  const [preview, setPreview] = useState(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setError('');
    setSuccess(false);

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await uploadExpertPhoto(profileId, formData);
      setPreview(res.data.photoUrl);
      setSuccess(true);
      if (onUploadSuccess) onUploadSuccess(res.data.photoUrl);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
      setPreview(currentPhoto || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Preview */}
      <div
        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 cursor-pointer group"
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
            EC
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <span className="text-white text-xs font-medium">📷 Change</span>
          )}
        </div>
      </div>

      {/* Click to upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : preview ? '📷 Change Photo' : '📷 Add Profile Photo'}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status messages */}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">✅ Photo updated!</p>}
      <p className="text-xs text-gray-400">JPG, PNG or WebP · Max 5MB</p>
    </div>
  );
};

export default PhotoUpload;
