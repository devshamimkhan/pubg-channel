'use client';

import { useState, useRef } from 'react';
import { createPost } from '@/actions/posts';
import { uploadMediaFiles } from '@/lib/media/upload';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MediaUploadModal({ channelId, onClose }) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Handle local file preview
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);

      const newPreviews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    // reset input value to allow selecting same files again if removed
    e.target.value = null;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files via the shared helper
  const uploadFiles = async () => {
    if (!files || files.length === 0) return [];

    setUploadProgress(0);

    const uploadedFiles = await uploadMediaFiles(files, {
      onProgress: ({ percent }) => setUploadProgress(percent),
    });

    setUploadProgress(100);

    return uploadedFiles.map((file) => ({
      url: file.url,
      type: file.type,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      let mediaPayload = [];

      if (files && files.length > 0) {
        mediaPayload = await uploadFiles();
      }

      const result = await createPost({
        channel: channelId,
        author: session?.user?.id,
        type: 'media',
        content,
        media: mediaPayload,
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setUploadProgress(0);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp .3s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-sidebar)', borderRadius: '16px 16px 0 0'
        }}>
          <h2 className="font-raj" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            Upload Media
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <form id="mediaUploadForm" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.3)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', color: 'var(--accent-red)',
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Uploading media</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'var(--bg-card2)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            )}

            {/* Media Picker */}
            <div style={{ marginBottom: '16px' }}>
              {previews.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
                  {previews.map((preview, idx) => (
                    <div key={idx} style={{
                      position: 'relative', minWidth: '120px', width: '120px', height: '120px',
                      borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)',
                      flexShrink: 0
                    }}>
                      <button type="button" onClick={() => removeFile(idx)} style={{
                        position: 'absolute', top: '6px', right: '6px', zIndex: 10,
                        width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
                        color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                      </button>
                      {preview.type === 'video' ? (
                        <video src={`${preview.url}#t=0.1`} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={preview.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  ))}

                  {/* Add More Button */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      minWidth: '120px', width: '120px', height: '120px', border: '2px dashed var(--border)',
                      borderRadius: '12px', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: 'var(--bg-card2)', color: 'var(--text-muted)', flexShrink: 0
                    }}
                  >
                    <i className="fas fa-plus" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                    <span style={{ fontSize: '12px' }}>Add More</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%', height: '200px', border: '2px dashed var(--border)',
                    borderRadius: '12px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: 'var(--bg-card2)', color: 'var(--text-muted)',
                    overflow: 'hidden', position: 'relative'
                  }}
                >
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                  <span>Click to select Image or Video</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" multiple style={{ display: 'none' }} required={files.length === 0} />
            </div>

            {/* Caption */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text" value={content} onChange={e => setContent(e.target.value)}
                placeholder="Add a caption..." className="form-input"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button type="submit" form="mediaUploadForm" className="btn-gold" disabled={loading} style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Uploading...</> : <><i className="fas fa-paper-plane"></i> Publish Post</>}
          </button>
        </div>
      </div>
    </div>
  );
}
