export default function Avatar({ src, initial, large, online, className = '' }) {
  const sizeClass = large ? 'large' : '';
  
  return (
    <div className={`avatar ${sizeClass} ${className}`}>
      {src ? (
        <img src={src} alt="avatar" />
      ) : (
        initial || '?'
      )}
      {online && <div className="online-dot"></div>}
    </div>
  );
}
