export default function ChannelsPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '28px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,.35)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '18px',
            border: '1px solid rgba(212,175,55,.25)',
            background: 'rgba(212,175,55,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            fontSize: '26px',
          }}
        >
          <i className="fas fa-comments" />
        </div>
        <h1 className="font-raj" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          Select a channel
        </h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
          Choose a channel from the sidebar to open the latest posts. Newest posts stay at the bottom like WhatsApp or Messenger.
        </p>
      </div>
    </div>
  );
}
