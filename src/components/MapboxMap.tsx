'use client'
import { useEffect, useRef } from 'react'
import type { Friend, City } from '@/types/database'
import { STATUS_CONFIG, LEVEL_CONFIG, getCityAlertLevel } from '@/lib/cities'

interface Props {
  cities:       City[]
  friends:      Friend[]
  activeAlerts: string[]
}

export default function MapboxMap({ cities, friends, activeAlerts }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<any[]>([])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    // Dynamically load mapbox-gl
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js'
    script.onload = () => {
      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [34.9, 31.5],
        zoom: 6.5,
        language: 'he',
      })

      mapRef.current = map
      map.on('load', () => renderMarkers(map, mapboxgl))
    }
    document.head.appendChild(script)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current) return
    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return
    renderMarkers(mapRef.current, mapboxgl)
  }, [friends, activeAlerts, cities]) // eslint-disable-line

  function renderMarkers(map: any, mapboxgl: any) {
    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // City alert circles via GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: cities.map(city => {
        const level = getCityAlertLevel(city, activeAlerts)
        const lc = LEVEL_CONFIG[level]
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [city.lng, city.lat] },
          properties: { color: lc.color, radius: level === 'red' ? 12 : 6, opacity: level === 'red' ? 0.4 : 0.15 }
        }
      })
    }

    if (map.getSource('cities')) {
      map.getSource('cities').setData(geojson)
    } else {
      map.addSource('cities', { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'city-circles',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius':   ['get', 'radius'],
          'circle-color':    ['get', 'color'],
          'circle-opacity':  ['get', 'opacity'],
          'circle-stroke-width': 1,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.6,
        }
      })
    }

    // Friend markers
    friends.forEach(friend => {
      const city = cities.find(c => c.name === friend.city_name)
      if (!city) return

      const sc    = STATUS_CONFIG[friend.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.safe
      const level = getCityAlertLevel(city, activeAlerts)
      const lc    = LEVEL_CONFIG[level]

      const el = document.createElement('div')
      el.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%;
        background: ${sc.bg}; border: 3px solid ${sc.color};
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 900; color: white;
        font-family: Heebo, sans-serif; cursor: pointer;
        box-shadow: 0 0 0 3px ${lc.color}55, 0 4px 12px rgba(0,0,0,0.6);
        ${level === 'red' ? 'animation: pulse-alert 1.2s infinite;' : ''}
        transition: transform .15s;
      `
      el.textContent = friend.name.slice(0, 2)
      el.onmouseenter = () => { el.style.transform = 'scale(1.15)' }
      el.onmouseleave = () => { el.style.transform = 'scale(1)' }

      const popup = new mapboxgl.Popup({
        offset: 20,
        className: 'safemap-popup',
        closeButton: false,
        maxWidth: '220px',
      }).setHTML(`
        <div dir="rtl" style="font-family:Heebo,sans-serif;padding:4px">
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
      `)

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([city.lng, city.lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
    })
  }

  return (
    <>
      <style>{`
        .safemap-popup .mapboxgl-popup-content {
          background: #1a2235; color: #f1f5f9;
          border: 1px solid #1e2d45; border-radius: 12px;
          padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .safemap-popup .mapboxgl-popup-tip { border-top-color: #1a2235; }
        @keyframes pulse-alert { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
      `}</style>
      <div ref={mapContainer} className="w-full h-full" />
    </>
  )
}
