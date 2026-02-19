"use client"

import { useState, useEffect, useCallback } from "react"
import type { StatusResponse } from "@/lib/types"

const POLL_INTERVAL = 30

export function useStatus() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState(POLL_INTERVAL)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status")
      if (!res.ok) throw new Error("Failed to fetch status")
      const json: StatusResponse = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setIsLoading(false)
      setCountdown(POLL_INTERVAL)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStatus()
          return POLL_INTERVAL
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [fetchStatus])

  return { data, error, isLoading, countdown }
}
