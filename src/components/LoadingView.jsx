export default function LoadingView({ title, message }) {
  return (
    <div className="loading-view">
      <div className="loading-card">
        <div className="spinner" />
        <h2 style={{ margin: '0 0 8px' }}>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>{message}</p>
      </div>
    </div>
  )
}
