import { describe, expect, it } from 'vitest'
import { ACCOUNT_DELETION_SLA_DAYS } from '../constants/accountDeletion'
import {
  buildCustomerDeletionRequestPayload,
  isPendingDeletionStatus,
  resolveCustomerDeletionWrite,
} from './accountDeletionService'

describe('customer account deletion request', () => {
  const now = new Date('2026-11-27T10:00:00.000Z')

  it('uses a 30-day SLA', () => {
    expect(ACCOUNT_DELETION_SLA_DAYS).toBe(30)
    const payload = buildCustomerDeletionRequestPayload(now)
    expect(payload.account_status).toBe('pending_deletion')
    expect(payload.deletion_requested_at).toBe('2026-11-27T10:00:00.000Z')
    expect(payload.scheduled_deletion_date).toBe('2026-12-27T10:00:00.000Z')
    expect(payload.updated_at).toBe('2026-11-27T10:00:00.000Z')
  })

  it('treats only pending_deletion as an existing request', () => {
    expect(isPendingDeletionStatus('pending_deletion')).toBe(true)
    expect(isPendingDeletionStatus('active')).toBe(false)
    expect(isPendingDeletionStatus(undefined)).toBe(false)
  })

  it('does not reset the schedule when a request is already pending', () => {
    const existing = {
      account_status: 'pending_deletion',
      deletion_requested_at: '2026-11-01T08:00:00.000Z',
      scheduled_deletion_date: '2026-12-01T08:00:00.000Z',
    }
    const later = new Date('2026-11-27T10:00:00.000Z')
    const result = resolveCustomerDeletionWrite(existing, later)
    expect(result.alreadyPending).toBe(true)
    expect(result.payload.deletion_requested_at).toBe(existing.deletion_requested_at)
    expect(result.payload.scheduled_deletion_date).toBe(existing.scheduled_deletion_date)
    expect(result.payload.updated_at).toBe('2026-11-27T10:00:00.000Z')
  })

  it('creates a new request when no pending record exists', () => {
    const result = resolveCustomerDeletionWrite({ account_status: 'active' }, now)
    expect(result.alreadyPending).toBe(false)
    expect(result.payload.scheduled_deletion_date).toBe('2026-12-27T10:00:00.000Z')
  })
})
