import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ACCOUNT_DELETION_SLA_DAYS, SUPPORT_EMAIL } from '../../constants/accountDeletion'
import { requestCustomerAccountDeletion } from '../../services/accountDeletionService'
import { ProfileFormModal } from './ProfileFormModal'

type Phase = 'idle' | 'confirm' | 'working' | 'done' | 'signingOut'

export function AccountDeletionSection() {
  const { user, logout } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')

  const close = () => {
    if (phase === 'working' || phase === 'signingOut') return
    setPhase('idle')
    setError('')
  }

  const submit = async () => {
    if (!user?.uid || phase === 'working') return
    setPhase('working')
    setError('')
    try {
      await requestCustomerAccountDeletion(user.uid)
      setPhase('done')
    } catch (err) {
      console.warn('[AccountDeletion] request failed:', err)
      setError('לא הצלחנו לשמור את הבקשה. נסו שוב, או פנו לתמיכה ב-' + SUPPORT_EMAIL)
      setPhase('confirm')
    }
  }

  const finishAndSignOut = async () => {
    if (phase === 'signingOut') return
    setPhase('signingOut')
    try {
      await logout()
    } catch (err) {
      console.warn('[AccountDeletion] sign-out failed after request:', err)
      setError('הבקשה נשמרה, אבל ההתנתקות נכשלה. התנתקו ידנית.')
      setPhase('done')
    }
  }

  return (
    <section className="rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-vantix-fg">הגדרות</h2>
      <p className="mb-4 text-sm text-vantix-fg-muted">
        אפשר לבקש כאן מחיקת חשבון. הבקשה תטופל תוך {ACCOUNT_DELETION_SLA_DAYS} יום.
      </p>
      <button
        type="button"
        onClick={() => {
          setError('')
          setPhase('confirm')
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3.5 font-semibold text-red-500 transition hover:bg-red-500/20 active:scale-[0.99]"
      >
        <Trash2 className="h-5 w-5" />
        מחיקת חשבון
      </button>

      {phase !== 'idle' && (
        <ProfileFormModal
          title={phase === 'done' || phase === 'signingOut' ? 'הבקשה נקלטה' : 'מחיקת חשבון'}
          icon={<Trash2 className="h-5 w-5 text-red-500" />}
          onClose={phase === 'done' || phase === 'signingOut' ? () => void finishAndSignOut() : close}
          footer={
            phase === 'done' || phase === 'signingOut' ? (
              <button
                type="button"
                onClick={() => void finishAndSignOut()}
                disabled={phase === 'signingOut'}
                className="w-full rounded-xl bg-vantix-orange px-4 py-3 font-semibold text-white hover:brightness-110 disabled:opacity-60 dark:bg-vantix-cyan dark:text-black"
              >
                {phase === 'signingOut' ? 'מתנתקים…' : 'הבנתי, התנתקות'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={close}
                  disabled={phase === 'working'}
                  className="flex-1 rounded-xl border border-vantix-cyan/30 px-4 py-3 font-semibold text-vantix-fg hover:bg-vantix-cyan/10 disabled:opacity-60"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={phase === 'working'}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {phase === 'working' ? 'שומרים…' : 'אישור הבקשה'}
                </button>
              </>
            )
          }
        >
          {phase === 'done' || phase === 'signingOut' ? (
            <p className="text-sm leading-6 text-vantix-fg-muted">
              בקשת המחיקה נשמרה. נטפל בה תוך {ACCOUNT_DELETION_SLA_DAYS} יום ונמחק את החשבון
              והמידע האישי, בכפוף לחובות הדין. אם שיניתם דעתכם, פנו אל {SUPPORT_EMAIL} בהקדם.
              כעת תנותקו מהאפליקציה.
            </p>
          ) : (
            <div className="space-y-3 text-sm leading-6 text-vantix-fg-muted">
              <p>
                אישור הבקשה ישמור בקשת מחיקה בחשבון המחובר. החשבון והמידע האישי יימחקו תוך{' '}
                {ACCOUNT_DELETION_SLA_DAYS} יום, בכפוף לחובות תיעוד ודין. פעולה זו אינה מיידית.
              </p>
              <p>
                אחרי האישור תנותקו מהאפליקציה. אם תתחרטו, פנו לתמיכה ב-{SUPPORT_EMAIL} לפני תום
                התקופה.
              </p>
              {error ? <p className="text-red-500">{error}</p> : null}
            </div>
          )}
        </ProfileFormModal>
      )}
    </section>
  )
}
