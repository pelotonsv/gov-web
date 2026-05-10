import type { ApiEntity, ApiFinanceRecord, ApiFlowRecord } from './types'

const BASE    = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
const API_KEY = (import.meta.env.VITE_API_KEY  as string | undefined) ?? ''

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const headers: Record<string, string> = {}
  if (API_KEY) headers['X-API-Key'] = API_KEY
  const res = await fetch(url.toString(), API_KEY ? { headers } : undefined)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  const json = (await res.json()) as { result: T }
  return json.result
}

export async function fetchEntities(type?: 'public' | 'private'): Promise<ApiEntity[]> {
  return get<ApiEntity[]>('/api/entities', type ? { type } : undefined)
}

export async function fetchOutflows(entity: string, year: number): Promise<ApiFlowRecord[]> {
  return get<ApiFlowRecord[]>(`/api/outflows/${entity}`, { year: String(year) })
}

export async function fetchInflows(entity: string, year: number): Promise<ApiFlowRecord[]> {
  return get<ApiFlowRecord[]>(`/api/inflows/${entity}`, { year: String(year) })
}

export async function fetchFinances(
  entity: string,
  params?: { metric?: string; sub_metric?: string },
): Promise<ApiFinanceRecord[]> {
  const p: Record<string, string> = {}
  if (params?.metric)     p['metric']     = params.metric
  if (params?.sub_metric) p['sub_metric'] = params.sub_metric
  return get<ApiFinanceRecord[]>(`/api/finances/${entity}`, Object.keys(p).length ? p : undefined)
}
