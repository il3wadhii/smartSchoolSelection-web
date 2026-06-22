'use client'

// The floating "My child is in…" finder panel from the prototype hero.
import { GRADE_CHIPS, GradeFilterKey } from '@/lib/stages'

interface FinderPanelProps {
  grade: GradeFilterKey | null
  onGrade: (key: GradeFilterKey) => void
  area: string
  onArea: (area: string) => void
  curriculum: string
  onCurriculum: (c: string) => void
  areas: string[]
  curricula: string[]
  onFind: () => void
}

export default function FinderPanel({
  grade, onGrade, area, onArea, curriculum, onCurriculum, areas, curricula, onFind,
}: FinderPanelProps) {
  return (
    <div className="card relative z-10 -mt-14 mx-5 sm:mx-auto sm:max-w-xl p-5 shadow-finder rounded-[22px]">
      <div className="f-label mb-2.5">My child is in…</div>
      <div className="flex gap-2 flex-wrap">
        {GRADE_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onGrade(chip.key)}
            className={`chip min-w-[74px] px-[13px] py-2.5 text-[13.5px] ${
              grade === chip.key ? 'chip-on' : ''
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 mt-4">
        <select value={area} onChange={(e) => onArea(e.target.value)} className="input-field flex-1">
          <option value="All">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={curriculum} onChange={(e) => onCurriculum(e.target.value)} className="input-field flex-1">
          <option value="All">Any curriculum</option>
          {curricula.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <button onClick={onFind} className="btn-cta mt-4">
        Find schools
      </button>
    </div>
  )
}
