import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type DeviceCoords = { latitude: number; longitude: number }

export async function getDeviceCoordinates(): Promise<DeviceCoords | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      let permission = await Geolocation.checkPermissions()
      if (permission.location === 'prompt' || permission.location === 'prompt-with-rationale') {
        permission = await Geolocation.requestPermissions()
      }
      if (permission.location !== 'granted') {
        return null
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000,
      })

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch {
      return null
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => resolve(null),
      { maximumAge: 300000, timeout: 15000, enableHighAccuracy: false },
    )
  })
}
