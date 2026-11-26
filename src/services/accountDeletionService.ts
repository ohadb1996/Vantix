/**
 * Customer account-deletion request.
 * Writes a pending-deletion record under Customers/{uid}. Existing RTDB rules
 * already allow the signed-in customer to update their own node.
 * There is no Cloud Function yet that processes these requests.
 */
import { get, ref, update } from 'firebase/database'
import { getRealtimeDb } from '../lib/firebase'
import { ACCOUNT_DELETION_SLA_DAYS } from '../constants/accountDeletion'

export type CustomerDeletionRequestPayload = {
  account_status: 'pending_deletion'
  deletion_requested_at: string
  scheduled_deletion_date: string
  updated_at: string
}

export type CustomerDeletionRequestResult = {
  payload: CustomerDeletionRequestPayload
  alreadyPending: boolean
}

type ExistingDeletionFields = {
  account_status?: unknown
  deletion_requested_at?: unknown
  scheduled_deletion_date?: unknown
}

export function isPendingDeletionStatus(status: unknown): boolean {
  return status === 'pending_deletion'
}

export function buildCustomerDeletionRequestPayload(
  now = new Date(),
  slaDays = ACCOUNT_DELETION_SLA_DAYS,
): CustomerDeletionRequestPayload {
  const scheduled = new Date(now.getTime() + slaDays * 24 * 60 * 60 * 1000)
  const nowIso = now.toISOString()
  return {
    account_status: 'pending_deletion',
    deletion_requested_at: nowIso,
    scheduled_deletion_date: scheduled.toISOString(),
    updated_at: nowIso,
  }
}

/**
 * If a deletion request is already recorded, keep the original timestamps
 * so a retry does not extend the SLA.
 */
export function resolveCustomerDeletionWrite(
  existing: ExistingDeletionFields | null | undefined,
  now = new Date(),
): CustomerDeletionRequestResult {
  if (
    isPendingDeletionStatus(existing?.account_status) &&
    typeof existing?.deletion_requested_at === 'string' &&
    existing.deletion_requested_at.length > 0 &&
    typeof existing?.scheduled_deletion_date === 'string' &&
    existing.scheduled_deletion_date.length > 0
  ) {
    return {
      alreadyPending: true,
      payload: {
        account_status: 'pending_deletion',
        deletion_requested_at: existing.deletion_requested_at,
        scheduled_deletion_date: existing.scheduled_deletion_date,
        updated_at: now.toISOString(),
      },
    }
  }
  return { alreadyPending: false, payload: buildCustomerDeletionRequestPayload(now) }
}

export async function requestCustomerAccountDeletion(
  uid: string,
  now = new Date(),
): Promise<CustomerDeletionRequestResult> {
  const trimmed = uid.trim()
  if (!trimmed) {
    throw new Error('משתמש לא מחובר')
  }

  const rtdb = getRealtimeDb()
  const customerRef = ref(rtdb, `Customers/${trimmed}`)
  const snap = await get(customerRef)
  const existing = snap.exists() ? (snap.val() as ExistingDeletionFields) : null
  const result = resolveCustomerDeletionWrite(existing, now)

  if (!result.alreadyPending) {
    await update(customerRef, result.payload)
  }

  return result
}
