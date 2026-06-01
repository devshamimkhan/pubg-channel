'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateChannel, deleteChannel } from '@/actions/channels';
import { uploadSingleMediaFile } from '@/lib/media/upload';

export default function ChannelInfoPanel({ activeChannel, onClose, isOpen = true }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';

  const [isMuted, setIsMuted] = useState(false);
  
  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const avatarInputRef = useRef(null);

  // Forms state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    avatar: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    isVerified: false,
    isPinned: false,
    isReviewEnabled: false,
    tickerEnabled: true,
    tickerText: '',
  });

  const [channelData, setChannelData] = useState(activeChannel);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setChannelData(activeChannel);
  }, [activeChannel]);

  if (!activeChannel || !channelData) return null;

  // Edit Handlers
  const openEditModal = () => {
    setEditForm({
      name: channelData.name || '',
      description: channelData.description || '',
      avatar: channelData.avatar || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateChannel(channelData._id, editForm);
    setSaving(false);
    if (result.success) {
      if (result.channel) setChannelData(result.channel);
      setShowEditModal(false);
      toast.success('Channel updated successfully');
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to update channel');
    }
  };

  const handleAvatarChange = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setSaving(true);
      setAvatarUploadProgress(0);

      const uploadedFile = await uploadSingleMediaFile(file, {
        onProgress: ({ percent }) => setAvatarUploadProgress(percent),
      });

      if (!uploadedFile?.url) {
        throw new Error('Failed to upload image');
      }

      const result = await updateChannel(channelData._id, { avatar: uploadedFile.url });
      if (!result.success) {
        throw new Error(result.message || 'Failed to update avatar');
      }

      if (result.channel) setChannelData(result.channel);
      router.refresh();
    } catch (error) {
      setAvatarUploadProgress(0);
      toast.error(error?.message || 'Failed to update avatar');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteChannel(channelData._id);
    setDeleting(false);
    if (result.success) {
      setShowDeleteConfirm(false);
      onClose();
      toast.success('Channel deleted successfully');
      router.push('/channels');
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to delete channel');
    }
  };

  // Settings Handlers
  const openSettings = () => {
    setSettingsForm({
      isVerified: channelData.isVerified || false,
      isPinned: channelData.isPinned || false,
      isReviewEnabled: channelData.isReviewEnabled || false,
      tickerEnabled: channelData.tickerEnabled !== false,
      tickerText: channelData.tickerText || '',
    });
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const result = await updateChannel(channelData._id, settingsForm);
    setSaving(false);
    if (result.success) {
      if (result.channel) setChannelData(result.channel);
      setShowSettings(false);
      toast.success('Channel settings saved');
      router.refresh();
    } else {
      toast.error(result.message || 'Failed to save channel settings');
    }
  };

  return (
    <div
      id="right-panel-inner"
      style={{
        width: '360px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(24px)',
        opacity: isOpen ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease',
        willChange: 'transform, opacity',
      }}
    >
      {/* Header */}
      <div style={{display:'flex', alignItems:'center', gap:'24px', padding: '16px 20px', fontSize:'16px', fontWeight:'600', background:'var(--bg-card)', position:'sticky', top:'0', zIndex:'10', borderBottom:'1px solid #000'}}>
        <i className="fas fa-times" style={{cursor:'pointer', color:'var(--text-muted)', fontSize:'20px'}} onClick={onClose}></i>
        <span>Channel info</span>
      </div>

      <div style={{paddingBottom: '30px'}}>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarFileChange}
        />

        {/* Profile Image & Title */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding: '30px 20px 20px'}}>
          <div style={{position:'relative', width:'140px', height:'140px', marginBottom:'16px'}}>
            <div className="avatar large" style={{width:'100%', height:'100%', fontSize:'54px', borderRadius:'50%', background:'var(--bg-card2)', border:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {channelData.avatar ? (
                <img src={channelData.avatar} alt="" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
              ) : (
                <span>{channelData.name.charAt(0)}</span>
              )}
            </div>
            {isAdmin && (
              <div
                onClick={handleAvatarChange}
                style={{position:'absolute', bottom:'4px', right:'4px', background:'var(--green-wa)', color:'#111', width:'38px', height:'38px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid var(--bg-sidebar)', cursor:'pointer', fontSize:'16px', transition:'transform 0.2s', opacity: saving ? 0.7 : 1, pointerEvents: saving ? 'none' : 'auto'}}
              >
                <i className={saving ? 'fas fa-spinner fa-spin' : 'fas fa-camera'}></i>
              </div>
            )}
            {saving && avatarUploadProgress > 0 && (
              <div style={{ position:'absolute', bottom:'-22px', left:'50%', transform:'translateX(-50%)', fontSize:'12px', color:'var(--text-muted)', fontWeight:'600', whiteSpace:'nowrap' }}>
                {avatarUploadProgress}%
              </div>
            )}
          </div>

          <div style={{fontSize:'22px', fontWeight:'600', marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px'}}>
            {channelData.name} {channelData.isVerified && <i className="fas fa-check-circle" style={{color:'var(--gold)', fontSize:'16px'}}></i>}
          </div>
          <div style={{color:'var(--text-muted)', fontSize:'14px'}}>Official business account</div>
        </div>

        {/* Action Buttons */}
        <div style={{display:'flex', justifyContent:'center', gap:'20px', padding: '0 20px 24px'}}>
          {isAdmin && (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
              <button className="admin-action-btn" onClick={openEditModal}>
                <i className="fas fa-pen"></i>
              </button>
              <span style={{fontSize:'13px',color:'var(--text-main)',fontWeight:'500'}}>Edit</span>
            </div>
          )}
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
            <button className="admin-action-btn"><i className="fas fa-search"></i></button>
            <span style={{fontSize:'13px',color:'var(--text-main)',fontWeight:'500'}}>Search</span>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
            <button className="admin-action-btn"><i className="fas fa-share-nodes"></i></button>
            <span style={{fontSize:'13px',color:'var(--text-main)',fontWeight:'500'}}>Forward</span>
          </div>
        </div>

        {/* Description */}
        <div style={{padding:'20px', borderTop:'8px solid #000', position:'relative'}}>
          {isAdmin && (
            <i className="fas fa-pen" onClick={openEditModal} style={{position:'absolute', top:'24px', right:'20px', color:'var(--text-muted)', cursor:'pointer', fontSize:'15px', transition:'color 0.2s'}}></i>
          )}

          <div style={{color:'var(--text-main)', fontSize:'15px', lineHeight:'1.5', marginBottom:'12px', paddingRight:'30px'}}>
            {channelData.description || (
              <>
                Hi! Welcome to this official {channelData.name} chat.<br/>
                This is where you can get tips, see announcements, and hear about the newest features. Straight from us.<br/><br/>
                Official chats from us will always have a gold verified badge. And we&apos;ll never ask for your personal information.
              </>
            )}
          </div>
        </div>

        {/* Settings Options */}
        <div style={{padding:'10px 20px', borderTop:'8px solid #000'}}>
          {/* Mute Notifications */}
          <div
            onClick={() => setIsMuted(!isMuted)}
            style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 0', cursor:'pointer'}}
          >
            <div style={{display:'flex', alignItems:'center', gap:'16px', fontSize:'16px', color:'var(--text-main)'}}>
              <i className={isMuted ? 'fas fa-bell-slash' : 'fas fa-bell'} style={{width:'24px', textAlign:'center', color: isMuted ? 'var(--accent-red)' : 'var(--text-muted)', fontSize:'18px'}}></i>
              Mute notifications
            </div>
            <div style={{
              width:'40px', height:'24px', borderRadius:'12px',
              background: isMuted ? 'var(--green-light)' : 'rgba(255,255,255,0.1)',
              position:'relative', transition:'background 0.3s', cursor: 'pointer',
            }}>
              <div style={{
                width:'18px', height:'18px', borderRadius:'50%',
                background: isMuted ? '#fff' : 'var(--text-muted)',
                position:'absolute', top:'3px',
                left: isMuted ? '19px' : '3px',
                transition:'all 0.3s',
              }}></div>
            </div>
          </div>

          {/* Channel Settings — Admin only */}
          {isAdmin && (
            <div
              onClick={openSettings}
              style={{display:'flex', alignItems:'center', gap:'16px', padding: '16px 0', fontSize:'16px', color:'var(--text-main)', cursor:'pointer', transition: 'color .2s'}}
            >
              <i className="fas fa-cog" style={{width:'24px', textAlign:'center', color:'var(--text-muted)', fontSize:'18px'}}></i>
              Channel settings
            </div>
          )}

          {/* Delete Channel — Admin only */}
          {isAdmin && (
            <div
              onClick={() => setShowDeleteConfirm(true)}
              style={{display:'flex', alignItems:'center', gap:'16px', padding: '16px 0', fontSize:'16px', color:'#ef4444', cursor:'pointer', transition: 'color .2s'}}
            >
              <i className="fas fa-trash-alt" style={{width:'24px', textAlign:'center', fontSize:'18px'}}></i>
              Delete channel
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT CHANNEL MODAL ── */}
      {mounted && showEditModal && createPortal(
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowEditModal(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', width: '100%', maxWidth: '440px',
            padding: '0', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              
            }}>
              <h2 className="font-raj" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                <i className="fas fa-pen" style={{ color: 'var(--gold)', marginRight: '8px' }}></i>
                Edit Channel Info
              </h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Channel Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="form-input"
                  rows={4}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold" disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── CHANNEL SETTINGS OVERLAY ── */}
      {showSettings && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'var(--bg-sidebar)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
          }}>
            <i className="fas fa-arrow-left" onClick={() => setShowSettings(false)} style={{cursor:'pointer', color:'var(--text-muted)', fontSize:'18px'}}></i>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>Channel Settings</span>
          </div>

          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div
              onClick={() => setSettingsForm({...settingsForm, isVerified: !settingsForm.isVerified})}
              style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 0', cursor:'pointer', borderBottom: '1px solid var(--border)'}}
            >
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <i className="fas fa-check-circle" style={{color: settingsForm.isVerified ? 'var(--gold)' : 'var(--text-muted)', fontSize:'18px', width:'24px', textAlign:'center'}}></i>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>Verified Badge</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show gold verification badge</div>
                </div>
              </div>
              <div style={{
                width:'40px', height:'24px', borderRadius:'12px',
                background: settingsForm.isVerified ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                position:'relative', transition:'background 0.3s',
              }}>
                <div style={{
                  width:'18px', height:'18px', borderRadius:'50%',
                  background: settingsForm.isVerified ? '#000' : 'var(--text-muted)',
                  position:'absolute', top:'3px', left: settingsForm.isVerified ? '19px' : '3px', transition:'all 0.3s',
                }}></div>
              </div>
            </div>

            <div
              onClick={() => setSettingsForm({...settingsForm, isPinned: !settingsForm.isPinned})}
              style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 0', cursor:'pointer', borderBottom: '1px solid var(--border)'}}
            >
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <i className="fas fa-thumbtack" style={{color: settingsForm.isPinned ? 'var(--gold)' : 'var(--text-muted)', fontSize:'18px', width:'24px', textAlign:'center'}}></i>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>Pin Channel</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show in pinned section of sidebar</div>
                </div>
              </div>
              <div style={{
                width:'40px', height:'24px', borderRadius:'12px',
                background: settingsForm.isPinned ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                position:'relative', transition:'background 0.3s',
              }}>
                <div style={{
                  width:'18px', height:'18px', borderRadius:'50%',
                  background: settingsForm.isPinned ? '#000' : 'var(--text-muted)',
                  position:'absolute', top:'3px', left: settingsForm.isPinned ? '19px' : '3px', transition:'all 0.3s',
                }}></div>
              </div>
            </div>

            <div
              onClick={() => setSettingsForm({...settingsForm, isReviewEnabled: !settingsForm.isReviewEnabled})}
              style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 0', cursor:'pointer', borderBottom: '1px solid var(--border)'}}
            >
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <i className="fas fa-star" style={{color: settingsForm.isReviewEnabled ? 'var(--gold)' : 'var(--text-muted)', fontSize:'18px', width:'24px', textAlign:'center'}}></i>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>Enable Customer Reviews</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Allow subscribers to write reviews</div>
                </div>
              </div>
              <div style={{
                width:'40px', height:'24px', borderRadius:'12px',
                background: settingsForm.isReviewEnabled ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                position:'relative', transition:'background 0.3s',
              }}>
                <div style={{
                  width:'18px', height:'18px', borderRadius:'50%',
                  background: settingsForm.isReviewEnabled ? '#000' : 'var(--text-muted)',
                  position:'absolute', top:'3px', left: settingsForm.isReviewEnabled ? '19px' : '3px', transition:'all 0.3s',
                }}></div>
              </div>
            </div>

            <div
              onClick={() => setSettingsForm({...settingsForm, tickerEnabled: !settingsForm.tickerEnabled})}
              style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding: '16px 0', cursor:'pointer', borderBottom: '1px solid var(--border)'}}
            >
              <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                <i className="fas fa-bullhorn" style={{color: settingsForm.tickerEnabled ? 'var(--gold)' : 'var(--text-muted)', fontSize:'18px', width:'24px', textAlign:'center'}}></i>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>Enable Ticker</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show moving ticker message above feed</div>
                </div>
              </div>
              <div style={{
                width:'40px', height:'24px', borderRadius:'12px',
                background: settingsForm.tickerEnabled ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                position:'relative', transition:'background 0.3s',
              }}>
                <div style={{
                  width:'18px', height:'18px', borderRadius:'50%',
                  background: settingsForm.tickerEnabled ? '#000' : 'var(--text-muted)',
                  position:'absolute', top:'3px', left: settingsForm.tickerEnabled ? '19px' : '3px', transition:'all 0.3s',
                }}></div>
              </div>
            </div>

            <div style={{ paddingTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Ticker Text
              </label>
              <textarea
                value={settingsForm.tickerText}
                onChange={e => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                className="form-input"
                rows={4}
                placeholder="Enter scrolling ticker text..."
                style={{ resize: 'vertical', minHeight: '90px' }}
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="btn-gold"
              disabled={saving}
              style={{ width: '100%', marginTop: '24px', padding: '12px', justifyContent: 'center' }}
            >
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save Settings</>}
            </button>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION OVERLAY ── */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp .3s ease',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)' }}></i>
            </div>
            <h3 className="font-raj" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Delete Channel?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{channelData.name}</strong>? This action cannot be undone. All posts and data will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-outline"
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px',
                  background: 'var(--accent-red)', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: '700',
                  fontFamily: "'Rajdhani', sans-serif", cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? <><i className="fas fa-spinner fa-spin"></i> Deleting...</> : <><i className="fas fa-trash-alt"></i> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
