import { useCallback, useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin, X } from 'lucide-react'
import { PRESET_LOCATIONS, useObserverLocation } from '../context/location'
import { fmtDMS, fmtLat, fmtLon, parseNumber } from '../lib/format'

/** Fenêtre de choix du lieu d'observation (villes, géolocalisation ou saisie manuelle). À monter à l'ouverture. */
export function LocationDialog({ onClose }) {
  const { location, setLocation } = useObserverLocation()
  const [form, setForm] = useState(() => toForm(location))
  const [geoState, setGeoState] = useState('')
  const dialogRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector('select')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const lat = parseNumber(form.lat)
  const lon = parseNumber(form.lon)
  const elevation = parseNumber(form.elevation || '0')
  const valid = Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180

  const pickPreset = (name) => {
    const preset = PRESET_LOCATIONS.find((p) => p.name === name)
    if (preset) setForm(toForm(preset))
  }

  const geolocate = () => {
    if (!navigator.geolocation) {
      setGeoState("La géolocalisation n'est pas disponible sur ce navigateur.")
      return
    }
    setGeoState('Recherche de votre position…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          name: 'Ma position',
          lat: pos.coords.latitude.toFixed(4),
          lon: pos.coords.longitude.toFixed(4),
          elevation: pos.coords.altitude ? String(Math.round(pos.coords.altitude)) : '0',
        })
        setGeoState('Position trouvée.')
      },
      (err) => setGeoState(`Position indisponible : ${err.message}`),
      { enableHighAccuracy: false, timeout: 10_000 },
    )
  }

  const save = (e) => {
    e.preventDefault()
    if (!valid) return
    setLocation({
      name: form.name.trim() || 'Lieu personnalisé',
      lat,
      lon,
      elevation: Number.isFinite(elevation) ? elevation : 0,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-md rounded-b-none p-5 sm:rounded-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="location-title" className="flex items-center gap-2 text-lg font-bold">
            <MapPin size={18} className="text-orange-500" /> Lieu d'observation
          </h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <label className="label" htmlFor="loc-preset">
          Ville
        </label>
        <div className="flex gap-2">
          <select
            id="loc-preset"
            className="input"
            value={PRESET_LOCATIONS.some((p) => p.name === form.name) ? form.name : ''}
            onChange={(e) => pickPreset(e.target.value)}
          >
            <option value="">— Choisir une ville —</option>
            {PRESET_LOCATIONS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn shrink-0" onClick={geolocate} title="Utiliser ma position">
            <LocateFixed size={16} /> <span className="hidden sm:inline">Ma position</span>
          </button>
        </div>
        {geoState && <p className="mt-2 text-xs text-zinc-500">{geoState}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label" htmlFor="loc-name">
              Nom
            </label>
            <input id="loc-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="loc-lat">
              Latitude (° N+)
            </label>
            <input id="loc-lat" className="input font-mono" inputMode="decimal" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            <p className="mt-1 font-mono text-[11px] text-zinc-500">{Number.isFinite(lat) ? fmtDMS(lat) : 'invalide'}</p>
          </div>
          <div>
            <label className="label" htmlFor="loc-lon">
              Longitude (° E+, O−)
            </label>
            <input id="loc-lon" className="input font-mono" inputMode="decimal" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} />
            <p className="mt-1 font-mono text-[11px] text-zinc-500">{Number.isFinite(lon) ? fmtDMS(lon) : 'invalide'}</p>
          </div>
          <div>
            <label className="label" htmlFor="loc-elev">
              Altitude (m)
            </label>
            <input id="loc-elev" className="input font-mono" inputMode="decimal" value={form.elevation} onChange={(e) => setForm({ ...form, elevation: e.target.value })} />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={!valid}>
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}

const toForm = (loc) => ({
  name: loc.name,
  lat: String(loc.lat),
  lon: String(loc.lon),
  elevation: String(loc.elevation ?? 0),
})

/** Bouton compact affichant le lieu actuel et ouvrant le sélecteur. */
export function LocationButton({ className = '', showCoords = false }) {
  const { location } = useObserverLocation()
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <button type="button" className={`btn max-w-full ${className}`} onClick={() => setOpen(true)} title="Changer de lieu d'observation">
        <MapPin size={15} className="shrink-0 text-orange-500" />
        <span className="truncate">{location.name}</span>
        {showCoords && (
          <span className="hidden font-mono text-xs text-zinc-500 sm:inline">
            {fmtLat(location.lat, 2)} · {fmtLon(location.lon, 2)}
          </span>
        )}
      </button>
      {open && <LocationDialog onClose={close} />}
    </>
  )
}
