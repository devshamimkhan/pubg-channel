'use client';

import { useEffect, useRef } from 'react';

/**
 * Scrolls to the bottom of the feed ONCE on initial page load.
 *
 * Intentionally does NOT re-scroll on subsequent re-renders (e.g. after a
 * post is deleted or edited). New-post scrolling is handled separately by
 * ChannelInputBar.scrollFeedToBottom() right after a post is created.
 */
export default function FeedScrollAnchor() {
  const anchorRef = useRef(null);
  const didScroll = useRef(false);

  useEffect(() => {
    // Only run once — skip every re-render triggered by revalidatePath
    if (didScroll.current || !anchorRef.current) return;
    didScroll.current = true;
    anchorRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, []); // empty deps → runs only on mount

  return <div ref={anchorRef} style={{ height: '1px', flexShrink: 0 }} aria-hidden="true" />;
}
