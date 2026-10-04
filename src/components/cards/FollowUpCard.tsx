import { useState } from 'react'
import type { FollowUpCardData } from '../../types'

interface FollowUpCardProps {
  data: FollowUpCardData
  onUpdate?: (date: string, time: string, note?: string) => void
}

const TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

function getWeekDays() {
  const days = []
  const now = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push({
      label: dayNames[d.getDay()],
      date: d.getDate(),
      iso: d.toISOString().split('T')[0],
    })
  }
  return days
}

export function FollowUpCard({ data: _data, onUpdate }: FollowUpCardProps) {
  const days = getWeekDays()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return
    setConfirmed(true)
    onUpdate?.(selectedDate, selectedTime, note || undefined)
  }

  if (confirmed) {
    const day = days.find((d) => d.iso === selectedDate)
    return (
      <div className="ai-card px-4 py-4 flex items-center gap-3">
        <span className="text-lg">📅</span>
        <div>
          <p className="text-[13px] font-medium text-[#e8eaf0]">Follow-up scheduled</p>
          <p className="text-[11px] font-mono text-[#6b7490]">{day?.label} {day?.date} · {selectedTime}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-card">
      <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #1a2236' }}>
        <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">SCHEDULE FOLLOW-UP</span>
      </div>

      {/* Day strip */}
      <div className="flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {days.map((d) => {
          const isSelected = selectedDate === d.iso
          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(isSelected ? null : d.iso)}
              className="flex flex-col items-center px-2.5 py-2 rounded-xl shrink-0 transition-all"
              style={{
                background: isSelected ? '#3b82f6' : '#0f1218',
                border: `1px solid ${isSelected ? '#60a5fa' : '#1e2230'}`,
                minWidth: 44,
              }}
            >
              <span className="text-[9px] font-mono" style={{ color: isSelected ? '#bfdbfe' : '#4b5563' }}>{d.label}</span>
              <span className="text-[14px] font-semibold mt-0.5" style={{ color: isSelected ? '#fff' : '#9ba3b8' }}>{d.date}</span>
            </button>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-4 gap-1.5 px-3 pb-2">
        {TIMES.map((t) => {
          const isSelected = selectedTime === t
          return (
            <button
              key={t}
              onClick={() => setSelectedTime(isSelected ? null : t)}
              className="py-2 rounded-xl text-[11px] font-mono transition-all"
              style={{
                background: isSelected ? '#0d1a35' : '#0f1218',
                border: `1px solid ${isSelected ? '#3b82f6' : '#1e2230'}`,
                color: isSelected ? '#60a5fa' : '#6b7490',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Note */}
      <div className="px-3 pb-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for this meeting..."
          className="w-full rounded-xl px-3 py-2 text-[12px] outline-none"
          style={{
            background: '#0d1117',
            border: '1px solid #1e2a3a',
            color: '#c8cbd6',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{
            background: selectedDate && selectedTime ? '#3b82f6' : '#1e2230',
            color: selectedDate && selectedTime ? '#fff' : '#4b5563',
          }}
        >
          Schedule Follow-Up
        </button>
      </div>
    </div>
  )
}
