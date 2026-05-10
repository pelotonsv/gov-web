import type { ApiEntity } from '../../api/types'
import { ExternalLink } from 'lucide-react'

interface Props {
  entity: ApiEntity
}

export default function NewsTab({ entity }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">News</h2>
        <p className="text-sm text-stone-500">Recent coverage and announcements.</p>
      </div>

      <div className="rounded border border-stone-200 border-dashed p-8 text-center">
        <p className="text-sm text-stone-400 mb-3">
          Live news feed for <span className="font-medium text-stone-600">{entity.display}</span> will appear here once the API is connected.
        </p>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(entity.display)}&tbm=nws`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 transition-colors"
        >
          Search Google News
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
