'use client';
import { useState, useEffect, useRef, useTransition } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { toggleReaction } from '@/actions/reactions';
import { deletePost, updatePost } from '@/actions/posts';
import SafeHtml from '@/components/ui/SafeHtml';

export default function MediaPost({ post, isAdmin, currentUserId }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localMedia, setLocalMedia] = useState(post.media || []);

  // Delete flow
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPending, startTransition] = useTransition();

  const emojiRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) setShowEmojiPicker(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setZoomLevel(1);
  }, [activeIndex]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));

  const handleDownload = async (e) => {
    e.preventDefault();
    if (activeIndex === null) return;
    try {
      const url = localMedia[activeIndex].url;
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `media-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download started!');
    } catch {
      toast.error('Failed to download. Try again.');
    }
  };

  const confirmDelete = async () => {
    const snapshot = localMedia;   // for rollback
    const newMediaArray = localMedia.filter((_, idx) => idx !== activeIndex);
    const nextIndex = activeIndex >= newMediaArray.length
      ? newMediaArray.length - 1
      : activeIndex;

    // Optimistic UI update
    setLocalMedia(newMediaArray);
    setShowDeleteModal(false);
    if (newMediaArray.length === 0) setActiveIndex(null);
    else setActiveIndex(nextIndex);

    setIsDeleting(true);
    try {
      let res;
      if (newMediaArray.length === 0) {
        res = await deletePost(post._id);
      } else {
        res = await updatePost(post._id, { media: newMediaArray });
      }

      if (!res?.success) throw new Error(res?.message || 'Delete failed');
      toast.success(newMediaArray.length === 0
        ? 'Post deleted successfully'
        : 'Media removed successfully');
    } catch {
      // Rollback
      setLocalMedia(snapshot);
      setActiveIndex(activeIndex);
      toast.error('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleReaction = (emoji) => {
    if (!currentUserId) {
      toast.error('Please log in to react');
      return;
    }
    setShowEmojiPicker(false);
    setLocalReactions(prev => {
      let next = [...prev];
      next = next.map(r => {
        if (r.emoji !== emoji && r.users.includes(currentUserId)) {
          const newUsers = r.users.filter(id => id !== currentUserId);
          return { ...r, users: newUsers, count: newUsers.length };
        }
        return r;
      });
      const rIdx = next.findIndex(r => r.emoji === emoji);
      if (rIdx !== -1) {
        const users = [...next[rIdx].users];
        const uIdx = users.indexOf(currentUserId);
        if (uIdx !== -1) {
          users.splice(uIdx, 1);
          next[rIdx] = { ...next[rIdx], users, count: users.length };
        } else {
          users.push(currentUserId);
          next[rIdx] = { ...next[rIdx], users, count: users.length };
        }
      } else {
        next.push({ emoji, users: [currentUserId], count: 1 });
      }
      return next.filter(r => r.count > 0);
    });

    startTransition(async () => {
      const res = await toggleReaction(post._id, emoji, currentUserId);
      if (res.success && res.reactions) setLocalReactions(res.reactions);
    });
  };
  
  const mediaItems = localMedia;
  const displayMedia = localMedia.slice(0, 4);
  const remainingCount = localMedia.length - 4;

  const renderMediaItem = (item, index, isLastInGrid = false) => {
    const isVideo = item.type === 'video';
    
    return (
      <div 
        key={index} 
        className="relative w-full h-full bg-[#000] cursor-pointer group overflow-hidden"
        onClick={() => setActiveIndex(index)}
      >
        {isVideo ? (
          <>
            <video src={`${item.url}#t=0.1`} preload="metadata" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(250,186,37,.9)] flex items-center justify-center text-[#000] text-xl z-10 group-hover:scale-110 transition-transform shadow-lg">
                <i className="fas fa-play ml-1"></i>
              </div>
            </div>
          </>
        ) : (
          <img src={item.url} alt="Media" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
        
        {isLastInGrid && remainingCount > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    if (mediaItems.length === 1) {
      return (
        <div className="w-full h-[350px] rounded-xl overflow-hidden mb-2">
          {renderMediaItem(mediaItems[0], 0)}
        </div>
      );
    }
    
    if (mediaItems.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 h-[250px] rounded-xl overflow-hidden mb-2">
          {displayMedia.map((item, idx) => renderMediaItem(item, idx))}
        </div>
      );
    }
    
    if (mediaItems.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 h-[300px] rounded-xl overflow-hidden mb-2">
          <div className="row-span-2 col-span-1">
            {renderMediaItem(mediaItems[0], 0)}
          </div>
          <div className="col-span-1 h-full min-h-[148px]">
            {renderMediaItem(mediaItems[1], 1)}
          </div>
          <div className="col-span-1 h-full min-h-[148px]">
            {renderMediaItem(mediaItems[2], 2)}
          </div>
        </div>
      );
    }
    
    // 4 or more
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[300px] rounded-xl overflow-hidden mb-2">
        {displayMedia.map((item, idx) => renderMediaItem(item, idx, idx === 3))}
      </div>
    );
  };

  return (
    <>
      {localMedia.length > 0 && renderGrid()}

      {/* Fullscreen Lightbox (WhatsApp Style) */}
      {activeIndex !== null && activeIndex < localMedia.length && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[5000] bg-white dark:bg-[#0b141a] flex flex-col font-sans"
          onClick={() => setActiveIndex(null)}
        >
          {/* Top Bar */}
          <div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 !px-2 !py-2 shadow-sm z-20 bg-white dark:bg-[#202c33]"
            onClick={e => e.stopPropagation()}
          >
            <div className="hidden sm:flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--gold)] flex items-center justify-center text-black font-bold text-base sm:text-lg overflow-hidden flex-shrink-0">
                {post.author?.image ? (
                  <img src={post.author.image} alt="author" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-users"></i>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="font-semibold text-[14px] sm:text-[15px] text-[#111b21] dark:text-[#e9edef] leading-tight truncate">
                  {post.author?.name || 'Channel Admin'}
                </h4>
                <span className="text-[12px] sm:text-[13px] text-[#667781] dark:text-[#8696a0] mt-[2px] truncate">
                  {post.createdAt ? (
                    (() => {
                      const d = new Date(post.createdAt);
                      return `${d.toLocaleDateString('en-GB')} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}`;
                    })()
                  ) : 'Just now'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-end sm:justify-start flex-wrap gap-4 sm:gap-6 text-[#54656f] dark:text-[#aebac1] text-[18px] sm:text-[20px] w-full sm:w-auto pr-2.5 py-2.5">
              <button onClick={handleZoomOut} className="hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer" title="Zoom Out"><i className="fas fa-search-minus"></i></button>
              <button onClick={handleZoomIn} className="hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer" title="Zoom In"><i className="fas fa-search-plus"></i></button>
              
              <div ref={emojiRef} className="relative flex items-center">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer" title="React">
                  <i className="far fa-smile"></i>
                </button>
                {showEmojiPicker && (
                  <div className="absolute right-0 top-[120%] z-[5000] shadow-2xl">
                    <EmojiPicker onEmojiClick={(obj) => handleToggleReaction(obj.emoji)} theme="dark" emojiStyle="apple" width={320} height={400} />
                  </div>
                )}
              </div>

              <button onClick={handleDownload} className="hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer" title="Download">
                <i className="fas fa-download"></i>
              </button>

              {isAdmin && (
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="text-[#54656f] dark:text-[#aebac1] hover:text-red-500 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Delete this media"
                >
                  {isDeleting
                    ? <i className="fas fa-circle-notch fa-spin text-[18px]"></i>
                    : <i className="far fa-trash-alt"></i>
                  }
                </button>
              )}

              <button 
                className="hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ml-0 sm:ml-2"
                onClick={() => setActiveIndex(null)}
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div 
            className="flex-1 relative flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {activeIndex > 0 && (
              <button 
                className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#8696a0] bg-opacity-70 text-white flex items-center justify-center hover:bg-opacity-90 transition-all z-20 text-lg shadow-sm"
                onClick={() => setActiveIndex(prev => prev - 1)}
              >
                <i className="fas fa-chevron-left ml-[-2px]"></i>
              </button>
            )}
            
            {/* Image Container with relative positioning for reactions */}
            <div className="relative max-w-full flex-1 flex flex-col items-center justify-center p-6 min-h-0 overflow-auto no-scrollbar w-full">
              <div className="relative max-h-full max-w-full flex items-center justify-center h-full">
                {mediaItems[activeIndex].type === 'video' ? (
                  <video 
                    key={mediaItems[activeIndex].url} 
                    src={mediaItems[activeIndex].url} 
                    controls 
                    autoPlay 
                    playsInline 
                    preload="auto" 
                    className="max-w-full max-h-full object-contain shadow-sm" 
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' }} 
                  />
                ) : (
                  <img src={mediaItems[activeIndex].url} alt="Fullscreen Media" className="max-w-full max-h-full object-contain shadow-sm" style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' }} />
                )}
                
                {/* Floating Reactions Pill */}
                {localReactions && localReactions.length > 0 && (
                  <div className="absolute bottom-2 left-2 bg-white dark:bg-[#202c33] px-2 py-1 rounded-full shadow flex items-center gap-1 border border-gray-200 dark:border-gray-700 pointer-events-none" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'bottom left', transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
                    <div className="flex -space-x-1">
                      {localReactions.slice(0, 3).map((r, i) => (
                        <span key={i} className="text-sm z-10 bg-white dark:bg-[#202c33] rounded-full">{r.emoji}</span>
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 ml-1">
                      {localReactions.reduce((sum, r) => sum + r.count, 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {activeIndex < mediaItems.length - 1 && (
              <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#8696a0] bg-opacity-70 text-white flex items-center justify-center hover:bg-opacity-90 transition-all z-20 text-lg shadow-sm"
                onClick={() => setActiveIndex(prev => prev + 1)}
              >
                <i className="fas fa-chevron-right mr-[-2px]"></i>
              </button>
            )}
          </div>
          
          {/* Bottom Thumbnails */}
          <div 
            className="bg-white dark:bg-[#202c33] h-[70px] flex items-center justify-center gap-2 px-4 py-2 z-20 border-t border-[#e9edef] dark:border-[#222d34] overflow-x-auto w-full"
            onClick={e => e.stopPropagation()}
          >
            {mediaItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-[50px] h-[50px] flex-shrink-0 cursor-pointer overflow-hidden transition-all box-border ${
                  activeIndex === idx ? 'border-2 border-[#00a884] p-[2px]' : 'opacity-60 hover:opacity-100 border-none p-[2px]'
                }`}
              >
                <div className="w-full h-full relative bg-black">
                  {item.type === 'video' ? (
                    <>
                      <video src={`${item.url}#t=0.1`} preload="metadata" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <i className="fas fa-video text-white text-[10px] absolute bottom-1 left-1 drop-shadow-md"></i>
                      </div>
                    </>
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt="thumb" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* ── Delete Confirmation Modal ── */}
          {showDeleteModal && (
            <div
              className="fixed inset-0 z-[6000] flex items-center justify-center"
              style={{ background: 'rgba(11,20,26,0.75)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowDeleteModal(false)}
            >
              <div
                className="bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col items-center gap-4"
                onClick={e => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <i className="far fa-trash-alt text-red-500 text-3xl"></i>
                </div>

                {/* Text */}
                <div className="text-center">
                  <h3 className="text-[17px] font-semibold text-[#111b21] dark:text-[#e9edef] mb-1">
                    Delete this media?
                  </h3>
                  <p className="text-[13px] text-[#667781] dark:text-[#8696a0] leading-snug">
                    {localMedia.length === 1
                      ? 'This is the only media in this post. The entire post will be deleted.'
                      : 'Only this image/video will be removed. The rest of the post stays intact.'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 w-full mt-1">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-[10px] rounded-xl border border-[#d1d7db] dark:border-[#3b4a54] text-[15px] font-medium text-[#3b4a54] dark:text-[#d1d7db] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-[10px] rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[15px] font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {post.title && (
        <h3 className="post-title font-raj text-[17px] font-bold mb-1">
          <SafeHtml html={post.title} className="rich-html-content" />
        </h3>
      )}
      {post.content && (
        <SafeHtml
          html={post.content}
          className="post-desc text-sm text-[var(--text-sub)] mb-3 rich-html-content"
          style={{ whiteSpace: 'normal' }}
        />
      )}
    </>
  );
}
