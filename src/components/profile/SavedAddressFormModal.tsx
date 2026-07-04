import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { ProfileFormModal, Field, ModalActions } from './ProfileFormModal'
import { AddressAutocompleteField } from './AddressAutocompleteField'
import { formatFullAddress } from './savedDisplay'
import type { SavedAddress, SavedAddressInput } from '../../types/customerProfile'

export function SavedAddressFormModal({
  initial,
  saving,
  onSubmit,
  onClose,
}: {
  initial?: SavedAddress | null
  saving?: boolean
  onSubmit: (data: SavedAddressInput) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [city, setCity] = useState(initial?.delivery_city ?? '')
  const [street, setStreet] = useState(initial?.delivery_street ?? '')
  const [building, setBuilding] = useState(initial?.delivery_building_number ?? '')
  const [floor, setFloor] = useState(initial?.delivery_floor ?? '')
  const [apartment, setApartment] = useState(initial?.delivery_apartment ?? '')
  const [buildingCode, setBuildingCode] = useState(initial?.delivery_building_code ?? '')
  const [notes, setNotes] = useState(initial?.delivery_notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fullAddressValue = useMemo(
    () => formatFullAddress({ delivery_street: street, delivery_building_number: building, delivery_city: city }),
    [street, building, city]
  )

  const submit = () => {
    const err: Record<string, string> = {}
    if (!city.trim() || !street.trim()) err.fullAddress = 'נא לבחור כתובת מלאה מהרשימה'
    setErrors(err)
    if (Object.keys(err).length > 0) return
    onSubmit({
      label: label.trim() || undefined,
      delivery_city: city.trim(),
      delivery_street: street.trim(),
      delivery_building_number: building.trim() || '',
      delivery_floor: floor.trim() || undefined,
      delivery_apartment: apartment.trim() || undefined,
      delivery_building_code: buildingCode.trim() || undefined,
      delivery_notes: notes.trim() || undefined,
      isDefault: initial?.isDefault,
    })
  }

  return (
    <ProfileFormModal
      title={initial ? 'עריכת כתובת' : 'כתובת חדשה'}
      icon={<MapPin className="h-5 w-5 text-vantix-cyan" />}
      onClose={onClose}
      footer={<ModalActions onCancel={onClose} onSubmit={submit} saving={saving} />}
    >
      <Field label="כינוי לכתובת" placeholder="בית, עבודה..." value={label} onChange={setLabel} optional />
      <AddressAutocompleteField
        value={fullAddressValue}
        error={errors.fullAddress}
        required
        onSelect={({ city: nextCity, street: nextStreet, buildingNumber }) => {
          if (nextCity) {
            setCity(nextCity)
            setErrors((prev) => ({ ...prev, fullAddress: '' }))
          }
          if (nextStreet) {
            setStreet(nextStreet)
            setErrors((prev) => ({ ...prev, fullAddress: '' }))
          }
          if (buildingNumber) setBuilding(buildingNumber)
        }}
      />
      <div className="grid grid-cols-3 gap-3">
        <Field label="קומה" placeholder="קומה" value={floor} onChange={setFloor} optional />
        <Field label="דירה" placeholder="דירה" value={apartment} onChange={setApartment} optional />
        <Field label="קוד לבניין" placeholder="*147" value={buildingCode} onChange={setBuildingCode} optional />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-vantix-fg">
          הערות לשליח <span className="text-vantix-fg-subtle">(אופציונלי)</span>
        </label>
        <textarea
          value={notes}
          placeholder="לדוגמה: לחייג בהגעה"
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-vantix-cyan/25 bg-vantix-surface px-3 py-2.5 text-vantix-fg outline-none transition placeholder:text-vantix-fg-subtle focus:border-vantix-cyan/50 focus:ring-2 focus:ring-vantix-cyan/20"
        />
      </div>
    </ProfileFormModal>
  )
}
