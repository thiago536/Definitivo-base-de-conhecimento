"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { Pendencia } from "@/lib/supabase"

interface UseDynamicPendenciasOptions {
  pollingInterval?: number // em milissegundos, padrão 30 segundos
  enableRealtime?: boolean
  enablePolling?: boolean
}

export function useDynamicPendencias(options: UseDynamicPendenciasOptions = {}) {
  const {
    pollingInterval = 30000, // 30 segundos
    enableRealtime = true,
    enablePolling = true,
  } = options

  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const { toast } = useToast()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeChannelRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  // Função para buscar dados do backend
  const fetchPendencias = useCallback(
    async (showToast = false) => {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("pendencias").select("*").order("data", { ascending: false })

        if (error) throw error

        if (isMountedRef.current) {
          setPendencias(data || [])
          setLastUpdate(new Date())

          if (showToast) {
            toast({
              title: "Dados atualizados",
              description: "Lista de pendências sincronizada com o servidor",
              duration: 2000,
            })
          }
        }
      } catch (error) {
        console.error("Erro ao buscar pendências:", error)
        if (isMountedRef.current) {
          toast({
            title: "Erro ao atualizar dados",
            description: "Não foi possível sincronizar com o servidor",
            variant: "destructive",
            duration: 3000,
          })
        }
      }
    },
    [toast],
  )

  // Configurar Supabase Realtime
  const setupRealtime = useCallback(() => {
    if (!enableRealtime) return

    try {
      const supabase = getSupabaseClient()

      const channel = supabase
        .channel("pendencias-dynamic-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "pendencias",
          },
          async (payload) => {
            if (!isMountedRef.current) return

            console.log("🔄 Realtime update:", payload.eventType, payload)

            // Atualização instantânea baseada no tipo de evento
            if (payload.eventType === "INSERT" && payload.new) {
              const newPendencia = payload.new as Pendencia
              setPendencias((prev) => {
                // Evitar duplicatas
                const exists = prev.some((p) => p.id === newPendencia.id)
                if (exists) return prev

                // Inserir na posição correta (ordenado por data)
                const updated = [newPendencia, ...prev].sort(
                  (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
                )
                return updated
              })

              toast({
                title: "✅ Nova pendência adicionada",
                description: `"${newPendencia.titulo}" foi adicionada à lista`,
                duration: 3000,
              })
            } else if (payload.eventType === "UPDATE" && payload.new) {
              const updatedPendencia = payload.new as Pendencia
              setPendencias((prev) => prev.map((p) => (p.id === updatedPendencia.id ? updatedPendencia : p)))

              toast({
                title: "📝 Pendência atualizada",
                description: `"${updatedPendencia.titulo}" foi modificada`,
                duration: 3000,
              })
            } else if (payload.eventType === "DELETE" && payload.old) {
              const deletedId = (payload.old as any).id
              setPendencias((prev) => prev.filter((p) => p.id !== deletedId))

              toast({
                title: "🗑️ Pendência removida",
                description: "Uma pendência foi removida da lista",
                duration: 3000,
              })
            }

            setLastUpdate(new Date())
          },
        )
        .subscribe((status) => {
          if (isMountedRef.current) {
            setIsConnected(status === "SUBSCRIBED")

            if (status === "SUBSCRIBED") {
              console.log("✅ Realtime conectado para pendências")
            } else if (status === "CHANNEL_ERROR") {
              console.error("❌ Erro na conexão realtime")
              toast({
                title: "Erro na conexão em tempo real",
                description: "Algumas atualizações podem não aparecer automaticamente",
                variant: "destructive",
                duration: 5000,
              })
            }
          }
        })

      realtimeChannelRef.current = channel
    } catch (error) {
      console.error("Erro ao configurar realtime:", error)
    }
  }, [enableRealtime, toast])

  // Configurar polling automático
  const setupPolling = useCallback(() => {
    if (!enablePolling) return

    // Limpar interval anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Configurar novo interval
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log("🔄 Polling automático: buscando atualizações...")
        fetchPendencias(false) // Não mostrar toast para polling automático
      }
    }, pollingInterval)

    console.log(`⏰ Polling configurado para ${pollingInterval / 1000} segundos`)
  }, [enablePolling, pollingInterval, fetchPendencias])

  // Função para forçar atualização manual
  const forceRefresh = useCallback(async () => {
    setIsLoading(true)
    await fetchPendencias(true)
    setIsLoading(false)
  }, [fetchPendencias])

  // Função para adicionar pendência com atualização otimista
  const addPendenciaOptimistic = useCallback(
    async (novaPendencia: Omit<Pendencia, "id">) => {
      try {
        const supabase = getSupabaseClient()

        // Inserir no banco
        const { data, error } = await supabase.from("pendencias").insert([novaPendencia]).select().single()

        if (error) throw error

        // O realtime vai cuidar da atualização automática
        // Mas se não estiver conectado, atualizamos manualmente
        if (!isConnected && data) {
          setPendencias((prev) => {
            const updated = [data, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            return updated
          })
        }

        return data
      } catch (error) {
        console.error("Erro ao adicionar pendência:", error)
        throw error
      }
    },
    [isConnected],
  )

  // Função para atualizar status com atualização otimista
  const updateStatusOptimistic = useCallback(
    async (id: number, novoStatus: string) => {
      try {
        // Atualização otimista local
        setPendencias((prev) => prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p)))

        const supabase = getSupabaseClient()
        const { error } = await supabase.from("pendencias").update({ status: novoStatus }).eq("id", id)

        if (error) {
          // Reverter em caso de erro
          await fetchPendencias()
          throw error
        }

        // O realtime vai sincronizar automaticamente
      } catch (error) {
        console.error("Erro ao atualizar status:", error)
        throw error
      }
    },
    [fetchPendencias],
  )

  // Função para remover pendência com atualização otimista
  const removePendenciaOptimistic = useCallback(
    async (id: number) => {
      try {
        // Atualização otimista local
        const pendenciaRemovida = pendencias.find((p) => p.id === id)
        setPendencias((prev) => prev.filter((p) => p.id !== id))

        const supabase = getSupabaseClient()
        const { error } = await supabase.from("pendencias").delete().eq("id", id)

        if (error) {
          // Reverter em caso de erro
          if (pendenciaRemovida) {
            setPendencias((prev) =>
              [...prev, pendenciaRemovida].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
            )
          }
          throw error
        }

        // O realtime vai sincronizar automaticamente
      } catch (error) {
        console.error("Erro ao remover pendência:", error)
        throw error
      }
    },
    [pendencias],
  )

  // Inicialização
  useEffect(() => {
    isMountedRef.current = true

    const initialize = async () => {
      setIsLoading(true)
      await fetchPendencias()
      setIsLoading(false)

      // Configurar realtime e polling
      setupRealtime()
      setupPolling()
    }

    initialize()

    // Cleanup
    return () => {
      isMountedRef.current = false

      // Limpar polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      // Limpar realtime
      if (realtimeChannelRef.current) {
        const supabase = getSupabaseClient()
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [fetchPendencias, setupRealtime, setupPolling])

  return {
    // Dados
    pendencias,
    isLoading,
    isConnected,
    lastUpdate,

    // Ações
    forceRefresh,
    addPendenciaOptimistic,
    updateStatusOptimistic,
    removePendenciaOptimistic,

    // Configurações
    pollingInterval,
    enableRealtime,
    enablePolling,
  }
}
