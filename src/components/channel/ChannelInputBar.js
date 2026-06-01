'use client';

import { useState, useRef, useEffect } from 'react';
import CreatePostModal from './CreatePostModal';
import { createPost } from '@/actions/posts';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

export default function ChannelInputBar({ channelId, isAdmin }) {
  const [showPopover, setShowPopover] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeModalType, setActiveModalType] = useState(null); // 'media', 'announcement', 'uc-flash-sale', 'royal-pass'
  const [hasText, setHasText] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const savedRange = useRef(null);
  
  const popoverRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textareaRef = useRef(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Scroll the feed to the very bottom
  const scrollFeedToBottom = () => {
    const feed = document.getElementById('feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  };

  // Close popover and emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.textContent || '';
    const hasImages = textareaRef.current.querySelector('img') !== null;
    setHasText(text.trim().length > 0 || hasImages);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && textareaRef.current && textareaRef.current.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0);
    }
  };

  const onEmojiClick = (emojiObject) => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    
    if (savedRange.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    
    // Insert the high-quality Apple emoji image directly into the text area
    document.execCommand('insertHTML', false, `<img src="${emojiObject.imageUrl}" alt="${emojiObject.emoji}" style="width: 22px; height: 22px; vertical-align: middle; display: inline-block; margin: 0 1px;" class="apple-emoji" />`);
    
    handleInputChange();
    saveSelection();
  };

  const handleSendText = async () => {
    if (!hasText || isSending || !textareaRef.current) return;
    const content = textareaRef.current.innerHTML;
    setIsSending(true);
    try {
      const result = await createPost({
        channel: channelId,
        author: session?.user?.id,
        type: 'text',
        content: content,
      });

      if (!result?.success) {
        toast.error(result?.message || 'Failed to publish post');
        return;
      }

      toast.success('Post published successfully');

      textareaRef.current.innerHTML = '';
      setHasText(false);
      router.refresh();
      // Scroll after server component refresh settles
      setTimeout(scrollFeedToBottom, 180);
      setTimeout(scrollFeedToBottom, 600);
      setTimeout(scrollFeedToBottom, 1200);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const openModal = (type) => {
    setShowPopover(false);
    setActiveModalType(type);
  };

  if (!isAdmin) {
    return (
      <>
        <div id="input-bar" style={{ background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] bg-transparent hover:bg-[var(--bg-card)] transition-colors text-xl flex-shrink-0">
            <i className="far fa-smile"></i>
          </button>
          <div className="flex-1 text-[13px] text-[var(--text-sub)] font-medium bg-[var(--bg-card2)] border border-[var(--border)] rounded-full px-4 py-[11px] cursor-not-allowed text-center">
            <i className="fas fa-lock text-[10px] mr-1"></i> Only admins can send messages
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div id="input-bar" style={{ background: 'var(--bg-sidebar)', padding: '10px 16px', display: 'flex', alignItems: 'flex-end', gap: '12px', flexShrink: 0, position: 'relative' }}>
        
        {/* Left Side Attachment Button & Popover */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button 
            onClick={() => setShowPopover(!showPopover)}
            style={{ 
              background: showPopover ? 'var(--bg-card)' : 'none', 
              border: 'none', color: showPopover ? 'var(--text-main)' : 'var(--text-muted)', 
              cursor: 'pointer', fontSize: '22px',
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }} 
            title="Attach"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>

          {/* Popover Menu - WhatsApp Style */}
          {showPopover && (
            <div style={{
              position: 'absolute', bottom: '56px', left: '0',
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '12px 16px', minWidth: '220px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: '16px',
              animation: 'slideUp 0.2s ease', zIndex: 100
            }}>
              <div onClick={() => openModal('media')} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0052CC, #4C9AFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}><i className="fas fa-image"></i></div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Photos & videos</span>
              </div>
              
              <div onClick={() => openModal('announcement')} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00A884, #25D366)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}><i className="fas fa-bullhorn"></i></div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Announcement</span>
              </div>

              <div onClick={() => openModal('uc-flash-sale')} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF4444, #FF7B7B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}><i className="fas fa-bolt"></i></div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>UC Flash Sale</span>
              </div>

              <div onClick={() => openModal('royal-pass')} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #9d4edd, #c77dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}><i className="fas fa-crown"></i></div>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Royal Pass</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={emojiPickerRef}>
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{ 
              background: showEmojiPicker ? 'var(--bg-card)' : 'none', 
              border: 'none', 
              color: showEmojiPicker ? 'var(--gold)' : 'var(--text-muted)', 
              cursor: 'pointer', 
              fontSize: '22px',
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }} 
            title="Emoji"
          >
            <i className="far fa-face-smile"></i>
          </button>
          
          {showEmojiPicker && (
            <div style={{
              position: 'absolute', bottom: '56px', left: '0',
              zIndex: 100, animation: 'slideUp 0.2s ease'
            }}>
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme="dark"
                emojiStyle="apple"
                searchDisabled={false}
                skinTonesDisabled={true}
                width={300}
                height={400}
                style={{
                  backgroundColor: 'var(--bg-sidebar)',
                  borderColor: 'var(--border)',
                  '--epr-picker-border-color': 'var(--border)',
                  '--epr-bg-color': 'var(--bg-sidebar)',
                  '--epr-hover-bg-color': 'var(--bg-card2)',
                  '--epr-text-color': 'var(--text-main)',
                  '--epr-search-border-color': 'var(--border)',
                }}
              />
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div 
            ref={textareaRef}
            contentEditable={!isSending}
            onInput={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onBlur={saveSelection}
            data-placeholder="Type an update"
            className="chat-input-editable"
            style={{ 
              width: '100%', background: 'var(--bg-card2)', border: 'none', 
              borderRadius: '8px', padding: '12px 16px', fontSize: '15px', 
              color: 'var(--text-main)', outline: 'none',
              minHeight: '44px', maxHeight: '150px', overflowY: 'auto',
              fontFamily: 'inherit', lineHeight: '1.4',
              cursor: 'text'
            }}
          />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          .chat-input-editable:empty:before {
            content: attr(data-placeholder);
            color: var(--text-muted);
            pointer-events: none;
            display: block;
          }
          .chat-input-editable img.apple-emoji {
            user-select: all;
          }
        `}} />

        <button 
          onClick={handleSendText}
          disabled={!hasText || isSending}
          style={{ 
            background: hasText ? 'var(--green-wa)' : 'transparent',
            border: 'none', 
            color: hasText ? '#fff' : 'var(--text-muted)', 
            cursor: hasText ? 'pointer' : 'default', 
            fontSize: '18px',
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isSending ? 0.5 : 1,
            transition: 'all 0.2s'
          }} 
          title="Send"
        >
          {isSending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane" style={{ marginLeft: hasText ? '-2px' : '0' }}></i>}
        </button>
      </div>

      {/* Render Modal if a template is selected */}
      {activeModalType && (
        <CreatePostModal 
          type={activeModalType} 
          channelId={channelId} 
          onClose={() => setActiveModalType(null)} 
        />
      )}
    </>
  );
}
