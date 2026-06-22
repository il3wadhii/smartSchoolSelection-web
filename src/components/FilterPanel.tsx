'use client'

import { useMemo } from 'react'
import { School, SchoolFilters } from '@/types'
import { ALL_EDUCATIONAL_STAGES } from '@/lib/filters'
import { SlidersHorizontal, X } from 'lucide-react'

interface FilterPanelProps {
  schools: School[]
  filters: SchoolFilters
  onChange: (filters: SchoolFilters) => void
  isAuthenticated: boolean
}

const Chip = ({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) => (
  <button type="button" onClick={onClick} className={`chip ${selected ? 'chip-on' : 'chip-off'}`}>
    {label}
  </button>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-secondary-700 mb-2">{title}</h4>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

// Same filter set as the app's FilterModal; fee sorting is hidden for
// anonymous visitors because their responses carry no fees.
export default function FilterPanel({ schools, filters, onChange, isAuthenticated }: FilterPanelProps) {
  const areas = useMemo(
    () => Array.from(new Set(schools.map((s) => s.Area))).filter(Boolean).sort(),
    [schools]
  )
  const systems = useMemo(
    () => Array.from(new Set(schools.map((s) => s.system))).filter(Boolean).sort(),
    [schools]
  )
  const languages = useMemo(
    () =>
      Array.from(
        new Set(schools.flatMap((s) => s.languages?.split(/[,/-]/).map((l) => l.trim()) || []))
      )
        .filter(Boolean)
        .sort(),
    [schools]
  )

  const toggle = <K extends keyof SchoolFilters>(key: K, value: SchoolFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value })

  const hasAny = Object.values(filters).some((v) => v !== undefined)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-semibold text-secondary-900">
          <SlidersHorizontal className="h-4 w-4 text-primary-600" /> Filters
        </h3>
        {hasAny && (
          <button
            onClick={() => onChange({})}
            className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      <Section title="Area">
        {areas.map((area) => (
          <Chip key={area} label={area} selected={filters.area === area} onClick={() => toggle('area', area)} />
        ))}
      </Section>

      <Section title="Educational Stage">
        {ALL_EDUCATIONAL_STAGES.map((stage) => (
          <Chip
            key={stage}
            label={stage}
            selected={filters.educationalStage === stage}
            onClick={() => toggle('educationalStage', stage)}
          />
        ))}
      </Section>

      <Section title="Language">
        {languages.map((language) => (
          <Chip
            key={language}
            label={language}
            selected={filters.language === language}
            onClick={() => toggle('language', language)}
          />
        ))}
      </Section>

      <Section title="Curriculum System">
        {systems.map((system) => (
          <Chip key={system} label={system} selected={filters.system === system} onClick={() => toggle('system', system)} />
        ))}
      </Section>

      <Section title="Class Size">
        <Chip label="Small (< 20)" selected={filters.classSize === 0} onClick={() => toggle('classSize', 0)} />
        <Chip label="Medium (20–30)" selected={filters.classSize === 20} onClick={() => toggle('classSize', 20)} />
        <Chip label="Large (> 30)" selected={filters.classSize === 31} onClick={() => toggle('classSize', 31)} />
      </Section>

      {isAuthenticated && (
        <Section title="Sort by Fees">
          <Chip
            label="Cheapest first"
            selected={filters.feeSort === 'cheapest'}
            onClick={() => toggle('feeSort', 'cheapest')}
          />
          <Chip
            label="Highest first"
            selected={filters.feeSort === 'highest'}
            onClick={() => toggle('feeSort', 'highest')}
          />
        </Section>
      )}
    </div>
  )
}
