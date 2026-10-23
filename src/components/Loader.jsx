export default function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-accent-400 border-t-transparent" />
      <span className="animate-pulse text-sm text-night-500">{label}</span>
    </div>
  )
}
