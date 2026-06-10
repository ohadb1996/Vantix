import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import {
  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  getSavedContacts,
  addSavedContact,
  updateSavedContact,
  deleteSavedContact,
  getSavedPayments,
  addSavedPayment,
  updateSavedPayment,
  deleteSavedPayment,
  setDefaultSaved,
} from '../services/customerProfileService'
import type {
  SavedAddress,
  SavedAddressInput,
  SavedContact,
  SavedContactInput,
  SavedPayment,
  SavedPaymentInput,
  SavedEntityKind,
} from '../types/customerProfile'

function useSavedEntities<TItem extends { id: string }, TInput>(
  kind: SavedEntityKind,
  api: {
    list: (uid: string) => Promise<TItem[]>
    add: (uid: string, data: TInput) => Promise<string>
    update: (uid: string, id: string, data: Partial<TInput>) => Promise<void>
    remove: (uid: string, id: string) => Promise<void>
  },
) {
  const { user } = useAuth()
  const uid = user?.uid
  const queryClient = useQueryClient()
  const queryKey = ['customerProfile', kind, uid]

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => (uid ? api.list(uid) : Promise.resolve([])),
    enabled: !!uid,
    staleTime: 30 * 1000,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, kind, uid],
  )

  const addMutation = useMutation({
    mutationFn: (data: TInput) => {
      if (!uid) throw new Error('not authenticated')
      return api.add(uid, data)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TInput> }) => {
      if (!uid) throw new Error('not authenticated')
      return api.update(uid, id, data)
    },
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => {
      if (!uid) throw new Error('not authenticated')
      return api.remove(uid, id)
    },
    onSuccess: invalidate,
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => {
      if (!uid) throw new Error('not authenticated')
      return setDefaultSaved(uid, kind, id)
    },
    onSuccess: invalidate,
  })

  return {
    items,
    isLoading,
    add: addMutation.mutateAsync,
    update: (id: string, data: Partial<TInput>) => updateMutation.mutateAsync({ id, data }),
    remove: removeMutation.mutateAsync,
    setDefault: setDefaultMutation.mutateAsync,
    isSaving: addMutation.isPending || updateMutation.isPending,
    canSave: !!uid,
  }
}

export function useSavedAddresses() {
  return useSavedEntities<SavedAddress, SavedAddressInput>('savedAddresses', {
    list: getSavedAddresses,
    add: addSavedAddress,
    update: updateSavedAddress,
    remove: deleteSavedAddress,
  })
}

export function useSavedContacts() {
  return useSavedEntities<SavedContact, SavedContactInput>('savedContacts', {
    list: getSavedContacts,
    add: addSavedContact,
    update: updateSavedContact,
    remove: deleteSavedContact,
  })
}

export function useSavedPayments() {
  return useSavedEntities<SavedPayment, SavedPaymentInput>('savedPayments', {
    list: getSavedPayments,
    add: addSavedPayment,
    update: updateSavedPayment,
    remove: deleteSavedPayment,
  })
}
