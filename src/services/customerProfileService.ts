/**
 * שירות לניהול נתונים שמורים של לקוח – כתובות, פרטי קשר ואמצעי תשלום.
 * נשמר תחת Customers/{uid}/{kind}/{id} ב-RTDB.
 */
import { ref, get, push, update, remove } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'
import type {
  SavedEntityKind,
  SavedAddress,
  SavedAddressInput,
  SavedContact,
  SavedContactInput,
  SavedPayment,
  SavedPaymentInput,
} from '../types/customerProfile'

type WithId = { id: string; isDefault?: boolean; createdAt?: string }

function listPath(uid: string, kind: SavedEntityKind): string {
  return `Customers/${uid}/${kind}`
}

function itemPath(uid: string, kind: SavedEntityKind, id: string): string {
  return `Customers/${uid}/${kind}/${id}`
}

/** מסיר שדות undefined כי RTDB לא מקבל undefined */
function clean<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') out[k] = v
  }
  return out
}

async function listEntities<T extends WithId>(uid: string, kind: SavedEntityKind): Promise<T[]> {
  const rtdb = getRealtimeDb()
  const snap = await get(ref(rtdb, listPath(uid, kind)))
  if (!snap.exists()) return []
  const val = snap.val() as Record<string, Omit<T, 'id'>>
  const items = Object.entries(val).map(([id, data]) => ({ ...(data as object), id }) as T)
  // ברירת מחדל קודם, אחר כך לפי createdAt (חדש קודם)
  return items.sort((a, b) => {
    if (!!b.isDefault !== !!a.isDefault) return b.isDefault ? 1 : -1
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
}

async function addEntity(
  uid: string,
  kind: SavedEntityKind,
  data: Record<string, unknown>,
): Promise<string> {
  const rtdb = getRealtimeDb()
  const existing = await listEntities<WithId>(uid, kind)
  const isFirst = existing.length === 0
  const newRef = push(ref(rtdb, listPath(uid, kind)))
  const id = newRef.key
  if (!id) throw new Error('Failed to create entity')
  const payload = clean({
    ...data,
    // הפריט הראשון הופך אוטומטית לברירת מחדל
    isDefault: isFirst ? true : Boolean(data.isDefault),
    createdAt: new Date().toISOString(),
  })
  await update(ref(rtdb, itemPath(uid, kind, id)), payload)
  if (payload.isDefault) await setDefaultEntity(uid, kind, id)
  return id
}

async function updateEntity(
  uid: string,
  kind: SavedEntityKind,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const rtdb = getRealtimeDb()
  // שדות שהתרוקנו צריכים להימחק (null) ולא להישאר ישנים
  const sanitized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    sanitized[k] = v === undefined || v === '' ? null : v
  }
  delete sanitized.id
  delete sanitized.createdAt
  await update(ref(rtdb, itemPath(uid, kind, id)), sanitized)
  if (data.isDefault) await setDefaultEntity(uid, kind, id)
}

async function deleteEntity(uid: string, kind: SavedEntityKind, id: string): Promise<void> {
  const rtdb = getRealtimeDb()
  const items = await listEntities<WithId>(uid, kind)
  const wasDefault = items.find((i) => i.id === id)?.isDefault
  await remove(ref(rtdb, itemPath(uid, kind, id)))
  // אם נמחקה ברירת המחדל – הפוך את הפריט הבא לברירת מחדל
  if (wasDefault) {
    const next = items.find((i) => i.id !== id)
    if (next) await setDefaultEntity(uid, kind, next.id)
  }
}

async function setDefaultEntity(uid: string, kind: SavedEntityKind, id: string): Promise<void> {
  const rtdb = getRealtimeDb()
  const items = await listEntities<WithId>(uid, kind)
  const updates: Record<string, unknown> = {}
  for (const item of items) {
    updates[`${item.id}/isDefault`] = item.id === id
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb, listPath(uid, kind)), updates)
  }
}

/* ===== Addresses ===== */
export const getSavedAddresses = (uid: string) =>
  listEntities<SavedAddress>(uid, 'savedAddresses')
export const addSavedAddress = (uid: string, data: SavedAddressInput) =>
  addEntity(uid, 'savedAddresses', data as unknown as Record<string, unknown>)
export const updateSavedAddress = (uid: string, id: string, data: Partial<SavedAddressInput>) =>
  updateEntity(uid, 'savedAddresses', id, data as Record<string, unknown>)
export const deleteSavedAddress = (uid: string, id: string) =>
  deleteEntity(uid, 'savedAddresses', id)

/* ===== Contacts ===== */
export const getSavedContacts = (uid: string) =>
  listEntities<SavedContact>(uid, 'savedContacts')
export const addSavedContact = (uid: string, data: SavedContactInput) =>
  addEntity(uid, 'savedContacts', data as unknown as Record<string, unknown>)
export const updateSavedContact = (uid: string, id: string, data: Partial<SavedContactInput>) =>
  updateEntity(uid, 'savedContacts', id, data as Record<string, unknown>)
export const deleteSavedContact = (uid: string, id: string) =>
  deleteEntity(uid, 'savedContacts', id)

/* ===== Payments ===== */
export const getSavedPayments = (uid: string) =>
  listEntities<SavedPayment>(uid, 'savedPayments')
export const addSavedPayment = (uid: string, data: SavedPaymentInput) =>
  addEntity(uid, 'savedPayments', data as unknown as Record<string, unknown>)
export const updateSavedPayment = (uid: string, id: string, data: Partial<SavedPaymentInput>) =>
  updateEntity(uid, 'savedPayments', id, data as Record<string, unknown>)
export const deleteSavedPayment = (uid: string, id: string) =>
  deleteEntity(uid, 'savedPayments', id)

/* ===== Shared ===== */
export const setDefaultSaved = (uid: string, kind: SavedEntityKind, id: string) =>
  setDefaultEntity(uid, kind, id)
