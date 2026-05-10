import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchEntities } from './client'
import type { ApiEntity } from './types'

interface EntityContextValue {
  entities: ApiEntity[]
  loading: boolean
  error: string | null
  getEntity: (id: string) => ApiEntity | undefined
  search: (q: string) => ApiEntity[]
}

const EntityContext = createContext<EntityContextValue>({
  entities: [],
  loading: true,
  error: null,
  getEntity: () => undefined,
  search: () => [],
})

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<ApiEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchEntities('public'), fetchEntities('private')])
      .then(([pub, priv]) => setEntities([...pub, ...priv]))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load entities'))
      .finally(() => setLoading(false))
  }, [])

  function getEntity(id: string): ApiEntity | undefined {
    return entities.find((e) => e.entity === id)
  }

  function search(q: string): ApiEntity[] {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return entities.filter(
      (e) =>
        e.entity.includes(lower) ||
        e.display.toLowerCase().includes(lower) ||
        (e.ticker && e.ticker.toLowerCase().includes(lower)),
    )
  }

  return (
    <EntityContext.Provider value={{ entities, loading, error, getEntity, search }}>
      {children}
    </EntityContext.Provider>
  )
}

export function useEntityContext() {
  return useContext(EntityContext)
}
