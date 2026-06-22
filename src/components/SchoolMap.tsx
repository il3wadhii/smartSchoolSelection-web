'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { School } from '@/types'

// Kuwait bounding view
const KUWAIT_CENTER: [number, number] = [29.32, 47.95]

// Teardrop pin, brand teal normally / orange when selected — built as an
// inline SVG divIcon so we don't depend on Leaflet's image assets.
const pinIcon = (color: string, scale = 1) =>
  L.divIcon({
    className: 'ssp-pin',
    html: `<svg width="${28 * scale}" height="${38 * scale}" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 12.3 22.6 12.83 23.16a1.6 1.6 0 0 0 2.34 0C15.7 36.6 28 23.5 28 14 28 6.27 21.73 0 14 0Z" fill="${color}"/>
      <circle cx="14" cy="14" r="5.2" fill="#fff"/>
    </svg>`,
    iconSize: [28 * scale, 38 * scale],
    iconAnchor: [14 * scale, 38 * scale],
    popupAnchor: [0, -34 * scale],
  })

const TEAL = '#1A8A8C'
const ORANGE = '#F77F00'

// "You are here" marker — a blue dot with a white ring and a soft halo,
// the familiar GPS-location look. Built as a divIcon so it needs no assets.
const userIcon = L.divIcon({
  className: 'ssp-userloc',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.25),0 1px 4px rgba(0,0,0,.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
})

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: MapBounds) => void }) {
  const emit = () => {
    const b = map.getBounds()
    onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() })
  }
  const map = useMapEvents({ moveend: emit, zoomend: emit })
  useEffect(() => {
    emit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// Pan/zoom to the selected school when it changes
function FocusController({ school }: { school: School | null }) {
  const map = useMap()
  useEffect(() => {
    const lat = school?.location?.latitude
    const lng = school?.location?.longitude
    if (typeof lat === 'number' && typeof lng === 'number') {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
    }
  }, [school, map])
  return null
}

// Pan to the user's location the moment we get it
function UserFocus({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
  }, [location, map])
  return null
}

interface SchoolMapProps {
  schools: School[]
  selectedId: number | null
  onSelect: (id: number) => void
  onOpen: (id: number) => void
  onBoundsChange: (bounds: MapBounds) => void
  userLocation?: { lat: number; lng: number } | null
}

export default function SchoolMap({ schools, selectedId, onSelect, onOpen, onBoundsChange, userLocation }: SchoolMapProps) {
  const selected = useMemo(
    () => schools.find((s) => s.schoolID === selectedId) || null,
    [schools, selectedId]
  )
  const tealIcon = useMemo(() => pinIcon(TEAL), [])
  const orangeIcon = useMemo(() => pinIcon(ORANGE, 1.25), [])

  const withCoords = schools.filter(
    (s) => typeof s.location?.latitude === 'number' && typeof s.location?.longitude === 'number'
  )

  return (
    <MapContainer
      center={KUWAIT_CENTER}
      zoom={11}
      scrollWheelZoom
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <FocusController school={selected} />
      <UserFocus location={userLocation ?? null} />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={2000}>
          <Popup>
            <div style={{ fontWeight: 700, color: '#1B3A57', fontSize: 13 }}>You are here</div>
          </Popup>
        </Marker>
      )}
      {withCoords.map((s) => {
        const isSel = s.schoolID === selectedId
        return (
          <Marker
            key={s.schoolID}
            position={[s.location!.latitude as number, s.location!.longitude as number]}
            icon={isSel ? orangeIcon : tealIcon}
            zIndexOffset={isSel ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(s.schoolID) }}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, color: '#1B3A57', fontSize: 13 }}>{s.schoolName}</div>
                <div style={{ color: '#6B7A8C', fontSize: 11, marginTop: 2 }}>
                  {s.Area} · {s.system}
                </div>
                <button
                  onClick={() => onOpen(s.schoolID)}
                  style={{
                    marginTop: 8,
                    background: TEAL,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View details
                </button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
