import Avatar from '@/components/ui/Avatar';

export default function CustomerReviewPost({ post }) {
  const reviews = post.templateData?.reviews || [
    { name: 'Arif Hossain', initial: 'A', text: 'Fast delivery, got my UC in 2 mins!', time: '1 hr ago' },
    { name: 'Sadman Sakib', initial: 'S', text: 'Trusted page. Will buy again.', time: '3 hrs ago' }
  ];

  return (
    <>
      <span className="post-tag tag-offer"><i className="fas fa-star"></i> CUSTOMER REVIEW</span>
      <div className="post-title font-raj">⭐ {post.title || 'What Our Customers Say'}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '10px 0' }}>
        {reviews.map((rev, i) => (
          <div key={i} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div className="avatar" style={{ 
                width: '32px', height: '32px', fontSize: '13px', 
                background: `linear-gradient(135deg, #2D4A1A, #4A8A25)`
              }}>
                {rev.initial}
              </div>
              <div>
                <div className="font-raj" style={{ fontSize: '13px', fontWeight: '700' }}>{rev.name}</div>
                <div style={{ color: 'var(--gold)', fontSize: '11px' }}>★★★★★</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-sub)' }}>{rev.time}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>"{rev.text}"</div>
          </div>
        ))}
      </div>

      <button className="action-btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}>
        <i className="fas fa-comments"></i> View All Reviews
      </button>
    </>
  );
}
