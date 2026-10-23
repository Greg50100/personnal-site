import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'

/** Isole les erreurs d'un outil : une panne n'emporte pas tout le site. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="card card-pad flex items-start gap-3 border-red-500/40">
        <TriangleAlert className="mt-0.5 shrink-0 text-red-500" size={20} />
        <div>
          <p className="font-semibold">Cet outil a rencontré une erreur.</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{String(this.state.error?.message ?? this.state.error)}</p>
          <button type="button" className="btn mt-3" onClick={() => this.setState({ error: null })}>
            Réessayer
          </button>
        </div>
      </div>
    )
  }
}
