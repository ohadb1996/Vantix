import { MessageSquare, DoorOpen } from 'lucide-react'

export const LEAVE_BY_DOOR_NOTE = 'להשאיר ליד הדלת'

type DeliveryNotesInputProps = {
  value: string
  onChange: (notes: string) => void
}

function removeLeaveByDoorNote(notes: string): string {
  return notes
    .split('\n')
    .filter((line) => line.trim() !== LEAVE_BY_DOOR_NOTE)
    .join('\n')
    .trim()
}

export function DeliveryNotesInput({ value, onChange }: DeliveryNotesInputProps) {
  const leaveByDoorActive = value
    .split('\n')
    .some((line) => line.trim() === LEAVE_BY_DOOR_NOTE)

  const toggleLeaveByDoor = () => {
    if (leaveByDoorActive) {
      onChange(removeLeaveByDoorNote(value))
      return
    }
    onChange(value.trim() ? `${value.trim()}\n${LEAVE_BY_DOOR_NOTE}` : LEAVE_BY_DOOR_NOTE)
  }

  return (
    <section
      className="space-y-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface p-4"
      aria-labelledby="delivery-notes-heading"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="delivery-notes-heading" className="flex items-center gap-2 text-sm font-semibold text-vantix-fg">
          <MessageSquare className="h-4 w-4 text-vantix-cyan" aria-hidden />
          הערות למשלוח
        </h3>
        <button
          type="button"
          onClick={toggleLeaveByDoor}
          aria-pressed={leaveByDoorActive}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vantix-cyan focus-visible:ring-offset-2 ${
            leaveByDoorActive
              ? 'border-vantix-cyan bg-vantix-cyan/15 text-vantix-cyan'
              : 'border-vantix-cyan/20 bg-vantix-surface-raised text-vantix-fg-muted hover:border-vantix-cyan/40'
          }`}
        >
          <DoorOpen className="h-3.5 w-3.5" aria-hidden />
          להשאיר ליד הדלת
        </button>
      </div>

      <textarea
        id="delivery-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="לדוגמה: לחייג בהגעה, לא לצלצל בפעמון..."
        rows={2}
        className="w-full resize-none rounded-xl border border-vantix-cyan/25 bg-vantix-surface-raised px-3 py-2.5 text-sm text-vantix-fg outline-none transition placeholder:text-vantix-fg-subtle focus:border-vantix-cyan/50 focus:ring-2 focus:ring-vantix-cyan/20"
      />
    </section>
  )
}
