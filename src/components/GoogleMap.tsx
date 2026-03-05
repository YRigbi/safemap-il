'use client'
import { useEffect, useRef, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import type { Friend, City } from '@/types/database'
import { STATUS_CONFIG, LEVEL_CONFIG, getCityAlertLevel } from '@/lib/cities'

interface Props {
  cities:       City[]
  friends:      Friend[]
  activeAlerts: string[]
  onCityClick?: (city: City) => void
}

let loaderInstance: Loader | null = null

export default function GoogleMap({ cities, friends, activeAlerts, onCityClick }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null)
  const mapObj  = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const circles = useRef<google.maps.Circle[]>([])

  const buildMap = useCallback(async () => {
    if (!mapRef.current) return

    if (!loaderInstance) {
      loaderInstance = new Loader({
        apiKey:  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['marker'],
      })
    }

    await loaderInstance.load()

    const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary

    mapObj.current = new Map(mapRef.current, {
      center:    { lat: 31.5, lng: 34.9 },
      zoom:      7,
      mapId:     'safemap-dark',
      mapTypeControl:    false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: 'geometry',           stylers: [{ color: '#0a0f1e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1e' }] },
        { elementType: 'labels.text.fill',   stylers: [{ color: '#60a5fa' }] },
        { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#3b82f6' }] },
        { featureType: 'water',              elementType: 'geometry',            stylers: [{ color: '#1e3a5f' }] },
        { featureType: 'road',               elementType: 'geometry',            stylers: [{ color: '#1a2235' }] },
        { featureType: 'landscape',          elementType: 'geometry',            stylers: [{ color: '#111827' }] },
        { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
      ],
    })

    renderOverlays()
  }, []) // eslint-disable-line

  const renderOverlays = useCallback(async () => {
    if (!mapObj.current) return

    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary

    // Clear previous
    markers.current.forEach(m => { m.map = null })
    markers.current = []
    circles.current.forEach(c => c.setMap(null))
    circles.current = []

    // Alert circles per city
    cities.forEach(city => {
      const level  = getCityAlertLevel(city, activeAlerts)
      const cfg    = LEVEL_CONFIG[level]
      const inAlert = level === 'red'

      const circle = new google.maps.Circle({
        map:           mapObj.current,
        center:        { lat: city.lat, lng: city.lng },
        radius:        inAlert ? 8000 : 4000,
        strokeColor:   cfg.color,
        strokeOpacity: 0.6,
        strokeWeight:  inAlert ? 2 : 1,
        fillColor:     cfg.color,
        fillOpacity:   inAlert ? 0.25 : 0.1,
      })
      circles.current.push(circle)
    })

    // Friend markers
    friends.forEach(friend => {
      const city = cities.find(c => c.name === friend.city_name)
      if (!city) return

      const sc    = STATUS_CONFIG[friend.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.safe
      const level = getCityAlertLevel(city, activeAlerts)
      const lc    = LEVEL_CONFIG[level]

      const el = document.createElement('div')
      el.style.cssText = `
        width:44px; height:44px; border-radius:50%;
        background:${sc.bg}; border:3px solid ${sc.color};
        display:flex; align-items:center; justify-content:center;
        font-size:13px; font-weight:800; color:white;
        font-family:Heebo,sans-serif; cursor:pointer;
        box-shadow: 0 0 0 3px ${lc.color}55, 0 4px 12px rgba(0,0,0,0.5);
        ${level === 'red' ? 'animation:pulse-alert 1.2s infinite;' : ''}
      `
      el.textContent = friend.name.slice(0, 2)

      const infoWin = new google.maps.InfoWindow({
        content: `
          <div dir="rtl" style="min-width:180px;font-family:Heebo,sans-serif;background:#1a2235;color:#f1f5f9;padding:4px">
            <div style="font-weight:800;font-size:15px;margin-bottom:4px">${friend.name}</div>
            <div style="color:#94a3b8;font-size:12px;margin-bottom:8px">📍 ${friend.city_name}</div>
            <span style="background:${sc.bg};color:${sc.color};padding:3px 8px;border-radius:12px;font-size:12px;font-weight:700">
              ${sc.icon} ${sc.label}
            </span>
            <div style="margin-top:8px;background:${lc.color}22;border:1px solid ${lc.color}55;border-radius:8px;padding:6px 8px;font-size:12px">
              <b style="color:${lc.color}">${lc.label}</b><br>
              ⏱️ זמן מרחב: <b>${city.migun_time} שניות</b>
            </div>
          </div>`,
        headerDisabled: true,
      })

      const marker = new AdvancedMarkerElement({
        map:      mapObj.current,
        position: { lat: city.lat, lng: city.lng },
        content:  el,
        title:    friend.name,
      })

      marker.addListener('click', () => {
        infoWin.open({ map: mapObj.current, anchor: marker })
      })

      markers.current.push(marker)
    })
  }, [cities, friends, activeAlerts])

  useEffect(() => { buildMap() }, [buildMap])
  useEffect(() => { renderOverlays() }, [renderOverlays])

  return (
    <div ref={mapRef} className="w-full h-full" />
  )
}
