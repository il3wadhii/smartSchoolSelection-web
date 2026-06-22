// The Stage Line — the product's signature component. A horizontal path of
// four nodes (Preschool → KG → Primary → Secondary); nodes the school covers
// are filled with their stage color and connected.
import { StageKey, ALL_STAGES, STAGE_LABEL } from '@/lib/stages'

const STAGE_COLOR: Record<StageKey, string> = {
  nur: '#F77F00',
  kg: '#1A8A8C',
  pri: '#5B8FD9',
  int: '#9B7ED9',
  high: '#E0689A',
}

interface StageLineProps {
  stages: StageKey[]
  size?: 'sm' | 'md'
}

export default function StageLine({ stages, size = 'md' }: StageLineProps) {
  const dot = size === 'sm' ? 'h-2.5 w-2.5 border-2' : 'h-[13px] w-[13px] border-[2.5px]'
  const label = size === 'sm' ? 'text-[8px]' : 'text-[9px]'

  return (
    <div className="flex items-center" aria-label={`Stages covered: ${stages.map((s) => STAGE_LABEL[s]).join(', ') || 'none listed'}`}>
      {ALL_STAGES.map((key, i) => {
        const on = stages.includes(key)
        const linkOn = i < ALL_STAGES.length - 1 && stages.includes(key) && stages.includes(ALL_STAGES[i + 1])
        return (
          <span key={key} className="contents">
            <span className="flex flex-1 flex-col items-center gap-[3px]">
              <span
                className={`rounded-full ${dot}`}
                style={
                  on
                    ? { backgroundColor: STAGE_COLOR[key], borderColor: STAGE_COLOR[key] }
                    : { backgroundColor: '#E3E8EE', borderColor: '#E3E8EE' }
                }
              />
              <span className={`${label} font-extrabold tracking-[.04em] ${on ? 'text-muted' : 'text-[#B9C2CC]'}`}>
                {STAGE_LABEL[key]}
              </span>
            </span>
            {i < ALL_STAGES.length - 1 && (
              <span
                className="h-[2.5px] flex-1 min-w-[14px] mb-[14px]"
                style={{ backgroundColor: linkOn ? '#C5D2DF' : '#E3E8EE' }}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}
