import { createRoot, type Root } from 'react-dom/client'
import { OrderTrackingMapPopup } from './OrderTrackingMapPopup'
import type { OrderTrackingMapMarker } from '../../hooks/useOrderTracking'

const roots = new WeakMap<HTMLElement, Root>()

export function mountMapPopup(marker: OrderTrackingMapMarker): HTMLElement {
  const container = document.createElement('div')
  container.className = 'vantix-gmaps-popup'
  const root = createRoot(container)
  roots.set(container, root)
  root.render(<OrderTrackingMapPopup marker={marker} />)
  return container
}

export function unmountMapPopup(container: HTMLElement | null | undefined) {
  if (!container) return
  const root = roots.get(container)
  if (root) {
    root.unmount()
    roots.delete(container)
  }
}
