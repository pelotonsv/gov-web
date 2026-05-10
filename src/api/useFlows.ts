import { useEffect, useState } from 'react'
import { fetchOutflows, fetchInflows } from './client'
import type { ApiFlowRecord } from './types'

const outflowsCache = new Map<string, ApiFlowRecord[]>()
const inflowsCache  = new Map<string, ApiFlowRecord[]>()

function useFlows(
  entity: string,
  year: number,
  cache: Map<string, ApiFlowRecord[]>,
  fetcher: (entity: string, year: number) => Promise<ApiFlowRecord[]>,
) {
  const key    = `${entity}:${year}`
  const cached = cache.get(key)

  const [records, setRecords] = useState<ApiFlowRecord[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (cache.has(key)) {
      setRecords(cache.get(key)!)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher(entity, year)
      .then((data) => {
        if (cancelled) return
        cache.set(key, data)
        setRecords(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load flows')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entity, year]) // eslint-disable-line react-hooks/exhaustive-deps

  return { records, loading, error }
}

export function useOutflows(entity: string, year: number) {
  return useFlows(entity, year, outflowsCache, fetchOutflows)
}

export function useInflows(entity: string, year: number) {
  return useFlows(entity, year, inflowsCache, fetchInflows)
}
