import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import './App.css'

// Warm, organic color palette
const warmBg = 'bg-amber-100 dark:bg-amber-900'
const warmCard = 'bg-amber-200 dark:bg-amber-800 border-amber-400 dark:border-amber-700'

// Custom mushroom pin icon
const mushroomIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
})

type Pin = {
  lat: number
  lng: number
  description: string
}

function useLocalPins() {
  const [pins, setPins] = useState<Pin[]>(() => {
    const saved = localStorage.getItem('mushroom-pins')
    return saved ? JSON.parse(saved) : []
  })
  useEffect(() => {
    localStorage.setItem('mushroom-pins', JSON.stringify(pins))
  }, [pins])
  return [pins, setPins] as const
}

function PinDropper({ onDrop }: { onDrop: (latlng: {lat: number, lng: number}) => void }) {
  useMapEvents({
    click(e: any) {
      onDrop(e.latlng)
    },
    contextmenu(e: any) {
      onDrop(e.latlng)
    }
  })
  return null
}

function App() {
  const [pins, setPins] = useLocalPins()
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<any>(null)
  const [editingPin, setEditingPin] = useState<number | null>(null)
  const [descDraft, setDescDraft] = useState('')

  // Try to get user location on mount
  useEffect(() => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(pos => {
        mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15)
      })
    }
  }, [mapReady])

  // Add pin with empty description, but ask for confirmation first
  const handleDrop = (latlng: {lat: number, lng: number}) => {
    if (window.confirm('Save a new mushroom spot here?')) {
      setPins([...pins, { ...latlng, description: '' }])
    }
  }

  // Start editing a pin
  const startEdit = (idx: number) => {
    setEditingPin(idx)
    setDescDraft(pins[idx].description)
  }

  // Save description
  const saveDesc = (idx: number) => {
    setPins(pins.map((p, i) => i === idx ? { ...p, description: descDraft } : p))
    setEditingPin(null)
    setDescDraft('')
  }

  // Delete pin
  const deletePin = (idx: number) => {
    setPins(pins.filter((_, i) => i !== idx))
    setEditingPin(null)
    setDescDraft('')
  }

  return (
    <div className={`min-h-screen flex flex-col ${warmBg} font-sans`}> 
      <header className="p-4 text-center">
        <h1 className="text-3xl font-bold text-green-900 dark:text-amber-200 mb-2">Mushroom Spotter</h1>
        <p className="text-lg text-green-800 dark:text-amber-300">Remember your best mushroom spots in the forest!</p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-2">
        <div className="w-full max-w-md h-[60vh] rounded-xl overflow-hidden shadow-lg border-2 border-amber-400">
          <MapContainer
            center={[60, 25]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
            ref={mapRef}
            whenReady={() => setMapReady(true)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <PinDropper onDrop={handleDrop} />
            {pins.map((pin, i) => (
              <Marker key={i} position={[pin.lat, pin.lng]} icon={mushroomIcon}>
                <Popup>
                  {editingPin === i ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        className="rounded p-1 border border-amber-400 text-green-900"
                        value={descDraft}
                        onChange={e => setDescDraft(e.target.value)}
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button className="bg-green-700 hover:bg-green-800 text-amber-100 font-bold rounded px-2 py-1" onClick={() => saveDesc(i)}>Save</button>
                        <button className="bg-gray-400 hover:bg-gray-600 text-white rounded px-2 py-1" onClick={() => setEditingPin(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="text-green-900 dark:text-amber-200 min-h-[2em]">{pin.description || <span className="italic text-gray-500">No description</span>}</div>
                      <div className="flex gap-2">
                        <button className="bg-green-700 hover:bg-green-800 text-amber-100 font-bold rounded px-2 py-1" onClick={() => startEdit(i)}>Edit</button>
                        <button className="bg-red-700 hover:bg-red-800 text-white rounded px-2 py-1" onClick={() => deletePin(i)}>Delete</button>
                      </div>
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className={`mt-4 p-4 rounded-xl border ${warmCard} w-full max-w-md`}>
          <h2 className="text-xl font-semibold mb-2 text-green-900 dark:text-amber-200">How to use</h2>
          <ul className="list-disc pl-5 text-green-800 dark:text-amber-300">
            <li>Tap or long-press on the map to drop a mushroom pin.</li>
            <li>Click a pin to add or edit a description, or to delete it.</li>
            <li>Your spots are saved for offline use.</li>
            <li>Works even without internet after first load.</li>
          </ul>
        </div>
      </main>
      <footer className="text-center p-2 text-green-900 dark:text-amber-200 opacity-70 text-xs">
        &copy; {new Date().getFullYear()} Mushroom Spotter. Happy hunting!
      </footer>
    </div>
  )
}

export default App
