import { useEffect, useRef, useState } from 'react'
import { ensureGoogleMapsLoaded } from '../../utils/loadGoogleMaps'
import type { OrderTrackingMapMarker } from '../../hooks/useOrderTracking'
import { googleMarkerIconForKind } from './googleMapMarkerIcons'
import { mountMapPopup, unmountMapPopup } from './mapPopupMount'

interface OrderTrackingMapProps {
  markers: OrderTrackingMapMarker[]
  className?: string
}

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

const ALLOWED_KINDS: OrderTrackingMapMarker['kind'][] = ['home', 'business', 'courier']

export function OrderTrackingMap({ markers, className = '' }: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRefs = useRef<google.maps.Marker[]>([])
  const markerListenerRefs = useRef<google.maps.MapsEventListener[]>([])
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const sharedInfoRef = useRef<google.maps.InfoWindow | null>(null)
  const activePopupElRef = useRef<HTMLElement | null>(null)
  const openMarkerIdRef = useRef<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const closeActivePopup = () => {
    sharedInfoRef.current?.close()
    if (activePopupElRef.current) {
      unmountMapPopup(activePopupElRef.current)
      activePopupElRef.current = null
    }
    openMarkerIdRef.current = null
  }

  const openPopupForMarker = (marker: google.maps.Marker, data: OrderTrackingMapMarker) => {
    const map = mapRef.current
    const info = sharedInfoRef.current
    if (!map || !info) return

    if (openMarkerIdRef.current === data.id) {
      closeActivePopup()
      return
    }

    closeActivePopup()
    const popupEl = mountMapPopup(data)
    activePopupElRef.current = popupEl
    openMarkerIdRef.current = data.id
    info.setContent(popupEl)
    info.open({ map, anchor: marker })
  }

  useEffect(() => {
    let cancelled = false
    ensureGoogleMapsLoaded()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const center = markers[0]?.coords ?? { lat: 32.0853, lng: 34.7818 }
        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'none',
          clickableIcons: false,
          styles: MAP_STYLES,
        })
        mapRef.current = map
        sharedInfoRef.current = new google.maps.InfoWindow({
          disableAutoPan: true,
          pixelOffset: new google.maps.Size(0, -6),
        })
        mapClickListenerRef.current = map.addListener('click', () => closeActivePopup())
        setMapReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      mapClickListenerRef.current?.remove()
      mapClickListenerRef.current = null
      closeActivePopup()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || markers.length === 0) return

    closeActivePopup()
    markerListenerRefs.current.forEach((l) => l.remove())
    markerListenerRefs.current = []
    markerRefs.current.forEach((m) => m.setMap(null))
    markerRefs.current = []

    const visibleMarkers = markers.filter((m) => ALLOWED_KINDS.includes(m.kind)).slice(0, 3)
    if (visibleMarkers.length === 0) return

    const bounds = new google.maps.LatLngBounds()

    visibleMarkers.forEach((m) => {
      const position = { lat: m.coords.lat, lng: m.coords.lng }
      bounds.extend(position)

      const marker = new google.maps.Marker({
        map,
        position,
        title: m.label,
        icon: googleMarkerIconForKind(m.kind),
        zIndex: m.kind === 'courier' ? 3 : m.kind === 'home' ? 2 : 1,
        cursor: 'pointer',
      })

      markerListenerRefs.current.push(
        marker.addListener('click', () => openPopupForMarker(marker, m))
      )
      markerRefs.current.push(marker)
    })

    if (visibleMarkers.length === 1) {
      map.setCenter(visibleMarkers[0].coords)
      map.setZoom(14)
    } else {
      map.fitBounds(bounds, { top: 100, right: 60, bottom: 120, left: 60 })
    }

    return () => {
      closeActivePopup()
      markerListenerRefs.current.forEach((l) => l.remove())
      markerListenerRefs.current = []
      markerRefs.current.forEach((m) => m.setMap(null))
      markerRefs.current = []
    }
  }, [markers, mapReady])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      aria-hidden
    />
  )
}
