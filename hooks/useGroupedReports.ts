"use client"

import { useEffect, useMemo, useState } from "react"

export interface Report {
  id: number
  title: string
  date: string
  summary: string
  category: string
  organization: string
  tags: string[]
}

interface Options<S> {
  statsUrl: string
  getKey: (stat: S) => string
  buildReportsUrl: (stat: S) => string
}

export function useGroupedReports<S>({ statsUrl, getKey, buildReportsUrl }: Options<S>) {
  const [stats, setStats] = useState<S[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [loadedReports, setLoadedReports] = useState<Record<string, Report[]>>({})
  const [loadingKeys, setLoadingKeys] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(statsUrl)
        const json = await res.json()
        if (!cancelled && json?.success) {
          setStats(json.data || [])
        }
      } catch (e) {
        console.error("Failed to load stats:", e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadStats()
    return () => {
      cancelled = true
    }
  }, [statsUrl])

  const loadReportsFor = async (stat: S) => {
    const key = getKey(stat)
    if (loadedReports[key]) return
    setLoadingKeys(prev => [...prev, key])
    try {
      const url = buildReportsUrl(stat)
      const res = await fetch(url)
      const json = await res.json()
      if (json?.success) {
        setLoadedReports(prev => ({ ...prev, [key]: json.data || [] }))
      }
    } catch (e) {
      console.error("Failed to load reports:", e)
    } finally {
      setLoadingKeys(prev => prev.filter(k => k !== key))
    }
  }

  const toggle = async (stat: S) => {
    const key = getKey(stat)
    if (selectedKey === key) {
      setSelectedKey(null)
      return
    }
    setSelectedKey(key)
    await loadReportsFor(stat)
  }

  const organizedStats = useMemo(() => {
    if (!selectedKey) return stats
    const selected = stats.find(s => getKey(s) === selectedKey)
    const rest = stats.filter(s => getKey(s) !== selectedKey)
    return (selected ? [selected, ...rest] : stats) as S[]
  }, [stats, selectedKey, getKey])

  return {
    stats,
    isLoading,
    selectedKey,
    setSelectedKey,
    loadedReports,
    loadingKeys,
    organizedStats,
    toggle,
  }
}

