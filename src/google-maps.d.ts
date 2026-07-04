/** Minimal Google Maps types for order tracking map */
declare namespace google.maps {
  interface MapsEventListener {
    remove(): void
  }

  class Map {
    constructor(el: HTMLElement, opts?: object)
    setCenter(latLng: { lat: number; lng: number }): void
    setZoom(zoom: number): void
    fitBounds(bounds: LatLngBounds, padding?: object): void
    addListener(eventName: string, handler: () => void): MapsEventListener
  }
  class Marker {
    constructor(opts?: object)
    setMap(map: Map | null): void
    addListener(eventName: string, handler: () => void): MapsEventListener
  }
  class InfoWindow {
    constructor(opts?: object)
    open(opts?: object): void
    close(): void
    setContent(content: HTMLElement | string): void
  }
  class Size {
    constructor(width: number, height: number)
  }
  class Point {
    constructor(x: number, y: number)
  }
  interface Icon {
    url?: string
    scaledSize?: Size
    anchor?: Point
  }
  class LatLngBounds {
    extend(latLng: { lat: number; lng: number }): void
  }
  enum SymbolPath {
    CIRCLE = 0,
  }
}
