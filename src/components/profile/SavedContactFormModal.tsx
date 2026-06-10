import { useState } from 'react'
import { User } from 'lucide-react'
import { ProfileFormModal, Field, ModalActions } from './ProfileFormModal'
import { isValidIsraeliPhone } from '../../utils/phone'
import type { SavedContact, SavedContactInput } from '../../types/customerProfile'

const REQUIRED = 'שדה חובה'
const PHONE_MSG = 'נא להזין מספר טלפון ישראלי תקין (05x-xxx-xxxx)'

export function SavedContactFormModal({
  initial,
  saving,
  onSubmit,
  onClose,
}: {
  initial?: SavedContact | null
  saving?: boolean
  onSubmit: (data: SavedContactInput) => void
  onClose: () => void
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [phoneSecondary, setPhoneSecondary] = useState(initial?.phoneSecondary ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = () => {
    const err: Record<string, string> = {}
    if (!fullName.trim()) err.fullName = REQUIRED
    if (!phone.trim()) err.phone = REQUIRED
    else if (!isValidIsraeliPhone(phone)) err.phone = PHONE_MSG
    if (phoneSecondary.trim() && !isValidIsraeliPhone(phoneSecondary)) err.phoneSecondary = PHONE_MSG
    setErrors(err)
    if (Object.keys(err).length > 0) return
    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      phoneSecondary: phoneSecondary.trim() || undefined,
      isDefault: initial?.isDefault,
    })
  }

  return (
    <ProfileFormModal
      title={initial ? 'עריכת פרטים אישיים' : 'פרטים אישיים חדשים'}
      icon={<User className="h-5 w-5 text-vantix-cyan" />}
      onClose={onClose}
      footer={<ModalActions onCancel={onClose} onSubmit={submit} saving={saving} />}
    >
      <Field label="שם מלא" placeholder="שם מלא" value={fullName} onChange={setFullName} error={errors.fullName} />
      <Field
        label="טלפון"
        placeholder="05x-xxx-xxxx"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={setPhone}
        error={errors.phone}
      />
      <Field
        label="טלפון משני"
        placeholder="05x-xxx-xxxx"
        type="tel"
        inputMode="tel"
        value={phoneSecondary}
        onChange={setPhoneSecondary}
        error={errors.phoneSecondary}
        optional
      />
    </ProfileFormModal>
  )
}
