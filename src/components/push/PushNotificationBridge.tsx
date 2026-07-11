import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import { haptic } from '../../lib/native'
import {
  initializePushNotifications,
  setPushForegroundHandler,
  type PushForegroundPayload,
} from '../../services/pushNotificationService'

function handleForegroundPush(payload: PushForegroundPayload, toast: ReturnType<typeof useToast>) {
  const { title, body, data } = payload
  const type = data?.type ?? ''

  if (type === 'order_rejected' || type === 'delivery_cancelled') {
    void haptic.error()
    toast.error(body || title || 'עדכון בהזמנה')
    return
  }
  if (type === 'wallet_cashback' || type === 'order_accepted' || type === 'pickup_completed' || type === 'delivery_delivered') {
    void haptic.success()
    toast.success(body || title || 'עדכון')
    return
  }
  void haptic.light()
  toast.info(body || title || 'עדכון בהזמנה')
}

export function PushNotificationBridge() {
  const { user } = useAuth()
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  useEffect(() => {
    setPushForegroundHandler((payload) => {
      handleForegroundPush(payload, toastRef.current)
    })
    return () => setPushForegroundHandler(null)
  }, [])

  useEffect(() => {
    if (!user?.uid) return
    void initializePushNotifications(user.uid)
  }, [user?.uid])

  return null
}
