export default function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      <span className="animate-pulse font-mono text-xs uppercase tracking-widest text-orange-500">{label}</span>
    </div>
  )
}
