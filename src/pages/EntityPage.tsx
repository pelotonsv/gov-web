import { useParams, Navigate } from 'react-router-dom'
import { useEntityContext } from '../api/EntityContext'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import SummaryTab from './tabs/SummaryTab'
import ChartsTab from './tabs/ChartsTab'
import FinancialsTab from './tabs/FinancialsTab'
import OutflowsTab from './tabs/OutflowsTab'
import InflowsTab from './tabs/InflowsTab'
import NewsTab from './tabs/NewsTab'
import AnalysisTab from './tabs/AnalysisTab'

const VALID_TABS = ['summary', 'charts', 'financials', 'outflows', 'inflows', 'news', 'analysis'] as const

export default function EntityPage() {
  const { id, tab }            = useParams<{ id: string; tab: string }>()
  const { getEntity, loading } = useEntityContext()
  const entity                 = id ? getEntity(id) : undefined

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-stone-400 text-sm">
        Loading...
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center flex-1 text-stone-400 text-sm">
        Entity not found.
      </div>
    )
  }

  if (!tab) return <Navigate to={`/entity/${id}/summary`} replace />
  if (!VALID_TABS.includes(tab as typeof VALID_TABS[number])) return <Navigate to={`/entity/${id}/summary`} replace />

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {tab === 'summary'    && <SummaryTab    entity={entity} />}
        {tab === 'charts'     && <ChartsTab     entity={entity} />}
        {tab === 'financials' && <FinancialsTab entity={entity} />}
        {tab === 'outflows'   && <OutflowsTab   entity={entity} />}
        {tab === 'inflows'    && <InflowsTab    entity={entity} />}
        {tab === 'news'       && <NewsTab       entity={entity} />}
        {tab === 'analysis'   && <AnalysisTab   entity={entity} />}
      </main>
      <RightPanel currentId={id!} />
    </div>
  )
}
