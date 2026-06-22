'use client'

// Horizontal scrolling filter pills on the results view.
interface FilterPillsProps {
  pills: string[]
  active: string
  onSelect: (pill: string) => void
}

export default function FilterPills({ pills, active, onSelect }: FilterPillsProps) {
  return (
    <div className="fbar flex gap-2 overflow-x-auto py-1">
      {pills.map((pill) => (
        <button
          key={pill}
          onClick={() => onSelect(pill)}
          className={`fpill ${active === pill ? 'fpill-on' : ''}`}
        >
          {pill}
        </button>
      ))}
    </div>
  )
}
