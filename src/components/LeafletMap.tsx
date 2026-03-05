'use client'
import { useEffect, useRef } from 'react'
import type { Friend, City } from '@/types/database'
import { STATUS_CONFIG, LEVEL_CONFIG, getCityAlertLevel } from '@/lib/cities'

interface Props {
  cities:       City[]
  friends:      Friend[]
  activeAlerts: string[]
}

export default function LeafletMap({ cities, friends, activeAlerts }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<any[]>([])
  const circlesRef   = useRef<any[]>([])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L

      const map = L.map(mapContainer.current, {
        center: [31.5, 34.9],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      })

      // Dark tile layer - OpenStreetMap (completely free)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      renderOverlays(map, L)
    }
    document.head.appendChild(script)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current) return
    const L = (window as any).L
    if (!L) return
    renderOverlays(mapRef.current, L)
  }, [friends, activeAlerts, cities]) // eslint-disable-line

  function renderOverlays(map: any, L: any) {
    // Clear old
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    circlesRef.current.forEach(c => map.removeLayer(c))
    circlesRef.current = []

    // City alert circles
    cities.forEach(city => {
      const level = getCityAlertLevel(city, activeAlerts)
      const lc = LEVEL_CONFIG[level]
      const inAlert = level === 'red'

      const circle = L.circleMarker([city.lat, city.lng], {
        radius:        inAlert ? 14 : 7,
        color:         lc.color,
        weight:        inAlert ? 2 : 1,
        fillColor:     lc.color,
        fillOpacity:   inAlert ? 0.35 : 0.12,
        opacity:       0.7,
      }).addTo(map)
      circlesRef.current.push(circle)
    })

    // Friend markers
    friends.forEach(friend => {
      const city = cities.find(c => c.name === friend.city_name)
      if (!city) return

      const sc    = STATUS_CONFIG[friend.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.safe
      const level = getCityAlertLevel(city, activeAlerts)
      const lc    = LEVEL_CONFIG[level]

      const html = `
        <div style="position:relative;width:44px;height:52px">
          <div style="
            width:44px;height:44px;border-radius:50%;
            background:${sc.bg};border:3px solid ${sc.color};
            display:flex;align-items:center;justify-content:center;
            font-size:13px;font-weight:800;color:white;
            font-family:Heebo,sans-serif;
            box-shadow:0 0 0 3px ${lc.color}44, 0 4px 12px rgba(0,0,0,0.6);
            ${level === 'red' ? 'animation:pulse-mk 1.2s infinite;' : ''}
          ">${friend.name.slice(0, 2)}</div>
          <div style="
            position:absolute;bottom:0;right:0;
            width:16px;height:16px;border-radius:50%;
            background:${sc.color};border:2px solid #111827;
            display:flex;align-items:center;justify-content:center;font-size:9px;
          ">${sc.icon}</div>
        </div>
        <style>
          @keyframes pulse-mk{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        </style>
      `

      const icon = L.divIcon({ html, className: '', iconSize: [44, 52], iconAnchor: [22, 52] })

      const marker = L.marker([city.lat, city.lng], { icon }).addTo(map)

      marker.bindPopup(`
        <div dir="rtl" style="min-width:190px;font-family:Heebo,sans-serif">
          <div style="font-weight:800;font-size:15px;margin-bottom:4px">${friend.name}</div>
          <div style="color:#94a3b8;font-size:12px;margin-bottom:8px">📍 ${friend.city_name}</div>
          <span style="background:${sc.bg};color:${sc.color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">
            ${sc.icon} ${sc.label}
          </span>
          <div style="margin-top:8px;background:${lc.color}22;border:1px solid ${lc.color}55;border-radius:8px;padding:6px 8px;font-size:12px">
            <b style="color:${lc.color}">${lc.label}</b><br>
            ⏱️ זמן מרחב: <b>${city.migun_time} שניות</b>
          </div>
        </div>
      `, { className: 'safemap-popup' })

      markersRef.current.push(marker)
    })
  }

  return (
    <>
      <style>{`
        .safemap-popup .leaflet-popup-content-wrapper {
          background: #1a2235 !important;
          color: #f1f5f9 !important;
          border: 1px solid #1e2d45 !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          font-family: Heebo, sans-serif !important;
          direction: rtl;
        }
        .safemap-popup .leaflet-popup-tip {
          background: #1a2235 !important;
        }
        .leaflet-container { background: #0a0f1e !important; }
      `}</style>
      <div ref={mapContainer} className="w-full h-full" />
    </>
  )
}
