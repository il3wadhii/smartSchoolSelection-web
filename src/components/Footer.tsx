import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-secondary-900 text-secondary-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-2">Smart School Selection</h3>
            <p className="text-sm text-secondary-300">
              Helping families in Kuwait find the right school — compare curricula,
              languages, fees, seat availability and real parent reviews.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-sm">Explore</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="hover:text-white">Browse schools</Link></li>
              <li><Link href="/compare" className="hover:text-white">Compare schools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-sm">Account</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/signup" className="hover:text-white">Create a free account</Link></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-700 mt-8 pt-6 text-xs text-secondary-400">
          © {new Date().getFullYear()} Smart School Selection. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
