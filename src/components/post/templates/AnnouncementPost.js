import Link from 'next/link';

export default function AnnouncementPost({ post }) {
  const steps = post.templateData?.steps || [];
  const ctaButtonText = post.templateData?.ctaButtonText || '';
  const whatsappLinkRaw = post.templateData?.whatsappLink || '';
  
  let ctaHref = '#';
  if (whatsappLinkRaw) {
    if (whatsappLinkRaw.startsWith('http')) {
      ctaHref = whatsappLinkRaw;
    } else {
      const cleanNumber = whatsappLinkRaw.replace(/[^\d+]/g, '');
      const defaultMessage = encodeURIComponent(`Hi! I'm interested in: ${post.title}`);
      ctaHref = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;
    }
  }

  return (
    <>
      {post.isPinned && (
        <div className="flex items-center gap-2 mb-3 text-[var(--accent-blue)] font-bold text-[11px] tracking-wider uppercase">
          <i className="fas fa-thumbtack text-[10px]"></i> Pinned Post
          <span className="ml-auto text-[10px] text-[var(--text-sub)] font-normal normal-case tracking-normal">Always on top</span>
        </div>
      )}

      {/* <div className="post-tag tag-pin">
        <i className="fas fa-thumbtack"></i> PINNED
      </div> */}

      <h3 className="post-title flex items-center gap-2 font-raj">
        📌 {post.title}
      </h3>

      <p className="post-desc">{post.content || post.desc}</p>

      {steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {steps.map((step, index) => {
            // Support both old format (string) and new format ({title, description})
            const stepTitle = typeof step === 'string' ? step : step.title;
            const stepDesc = typeof step === 'string' ? '' : step.description;

            return (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="step-num">{index + 1}</span>
                <div>
                  <div className="font-raj" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                    {stepTitle}
                  </div>
                  {stepDesc && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {stepDesc}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ctaButtonText && (
        <Link
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold w-full text-[14px] !py-[12px] shadow-[0_4px_16px_rgba(250,186,37,.25)] no-underline rounded-full"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
        >
          <i className="fab fa-whatsapp text-lg"></i> {ctaButtonText}
        </Link>
      )}
    </>
  );
}
