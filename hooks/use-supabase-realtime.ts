"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

type TableName = "faqs" | "acessos" | "authors" | "pendencias"

interface UseSupabaseRealtimeOptions<T> {
  table: TableName
  initialData?: T[]
  onInsert?: (item: T) => void
  onUpdate?: (item: T) => void
  onDelete?: (id: number) => void
  autoFetch?: boolean
  orderBy?: string
  orderAscending?: boolean
}

/**
 * Hook para gerenciar inscrições em tempo real do Supabase
 * @param options Opções de configuração
 * @returns Estado atual dos dados e status da conexão
 */
export function useSupabaseRealtime<T extends { id: number }>({
  table,
  initialData = [],
  onInsert,
  onUpdate,
  onDelete,
  autoFetch = true,
  orderBy,
  orderAscending = false,
}: UseSupabaseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Use refs to prevent unnecessary re-renders
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isMountedRef = useRef(true)

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete }
  }, [onInsert, onUpdate, onDelete])

  // Função para atualizar dados localmente
  const updateLocalData = useCallback((eventType: string, payload: any) => {
    if (!isMountedRef.current) return

    switch (eventType) {
      case "INSERT": {
        const newItem = payload.new as T
        setData((currentData) => {
          // Evitar duplicatas
          const exists = currentData.some((item) => item.id === newItem.id)
          if (exists) return currentData
          return [newItem, ...currentData]
        })
        callbacksRef.current.onInsert?.(newItem)
        break
      }
      case "UPDATE": {
        const updatedItem = payload.new as T
        setData((currentData) => currentData.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
        callbacksRef.current.onUpdate?.(updatedItem)
        break
      }
      case "DELETE": {
        const deletedId = (payload.old as T).id
        setData((currentData) => currentData.filter((item) => item.id !== deletedId))
        callbacksRef.current.onDelete?.(deletedId)
        break
      }
    }
  }, [])

  // Get the appropriate order column for each table
  const getOrderColumn = useCallback((tableName: TableName): string => {
    switch (tableName) {
      case "faqs":
        return "created_at"
      case "acessos":
        return "created_at"
      case "authors":
        return "created_at"
      case "pendencias":
        return "data" // pendencias uses 'data' instead of 'created_at'
      default:
        return "id"
    }
  }, [])

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!autoFetch || !isMountedRef.current) return

    try {
      setIsLoading(true)
      setError(null)
      const supabase = getSupabaseClient()

      // Use the provided orderBy or get the default for the table
      const orderColumn = orderBy || getOrderColumn(table)

      const { data: fetchedData, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .order(orderColumn, { ascending: orderAscending })

      if (fetchError) throw new Error(fetchError.message)
      if (isMountedRef.current) {
        setData(fetchedData as T[])
      }
    } catch (err) {
      console.error(`Error fetching ${table}:`, err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [table, autoFetch, orderBy, orderAscending, getOrderColumn])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!isMountedRef.current) return

    try {
      const supabase = getSupabaseClient()

      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      // Criar canal de inscrição para a tabela
      channelRef.current = supabase
        .channel(`${table}-realtime-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Escutar todos os eventos (insert, update, delete)
            schema: "public",
            table: table,
          },
          (payload) => {
            if (!isMountedRef.current) return
            console.log(`🔄 Realtime event on ${table}:`, payload.eventType, payload)
            updateLocalData(payload.eventType, payload)
          },
        )
        .subscribe((status) => {
          console.log(`📡 Subscription status for ${table}:`, status)
          if (isMountedRef.current) {
            setIsConnected(status === "SUBSCRIBED")
            if (status === "CHANNEL_ERROR") {
              setError(new Error(`Subscription error for ${table}`))
            }
          }
        })
    } catch (err) {
      console.error(`Error setting up realtime subscription for ${table}:`, err)
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }, [table, updateLocalData])

  // Main effect - only runs when table changes
  useEffect(() => {
    isMountedRef.current = true

    // Fetch initial data then setup subscription
    fetchInitialData().then(() => {
      if (isMountedRef.current) {
        setupRealtimeSubscription()
      }
    })

    // Cleanup function
    return () => {
      isMountedRef.current = false
      if (channelRef.current) {
        console.log(`🧹 Cleaning up subscription for ${table}`)
        const supabase = getSupabaseClient()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table]) // Only depend on table name

  const refetch = useCallback(async () => {
    await fetchInitialData()
  }, [fetchInitialData])

  return {
    data,
    setData,
    isLoading,
    isConnected,
    error,
    refetch,
  }
}
