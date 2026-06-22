// Trust stats strip under the finder — real platform numbers, never invented.
interface TrustStatsProps {
  schools: number | null
  reviews: number | null
}

export default function TrustStats({ schools, reviews }: TrustStatsProps) {
  const items = [
    { n: schools !== null ? String(schools) : '—', l: 'schools & nurseries listed' },
    { n: reviews !== null ? String(reviews) : '—', l: 'parent reviews' },
    { n: '100%', l: 'free for parents' },
  ]
  return (
    <div className="flex gap-3.5 px-5 sm:px-0 sm:max-w-xl sm:mx-auto pt-5">
      {items.map((item) => (
        <div key={item.l} className="flex-1 card rounded-2xl px-2.5 py-3 text-center">
          <div className="font-serif font-bold text-[19px] text-primary-600">{item.n}</div>
          <div className="text-[10.5px] text-muted font-bold mt-[2px] leading-[1.3]">{item.l}</div>
        </div>
      ))}
    </div>
  )
}
