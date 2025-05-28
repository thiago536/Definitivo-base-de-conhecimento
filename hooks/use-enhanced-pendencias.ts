"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Pendencia {
  id: number
  titulo: string
  descricao: string
  status: string
  urgente: boolean
  data: string
  author: string | null
}

interface UseEnhancedPendenciasOptions {
  pollingInterval?: number // em milissegundos, padrão 30 segundos
  enableRealtime?: boolean
  enablePolling?: boolean
  showPollingToasts?: boolean
}

export function useEnhancedPendencias(options: UseEnhancedPendenciasOptions = {}) {
  const {
    pollingInterval = 30000, // 30 segundos
    enableRealtime = true,
    enablePolling = true,
    showPollingToasts = false,
  } = options

  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isPolling, setIsPolling] = useState(false)

  const { toast } = useToast()
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeChannelRef = useRef<any>(null)
  const isMountedRef = useRef(true)
  const lastDataHashRef = useRef<string>("")

  // Função para gerar hash dos dados para detectar mudanças
  const generateDataHash = useCallback((data: Pendencia[]) => {
    return JSON.stringify(data.map((p) => ({ id: p.id, status: p.status, titulo: p.titulo })))
  }, [])

  // Função para buscar dados do backend
  const fetchPendencias = useCallback(
    async (isPollingUpdate = false) => {
      try {
        if (isPollingUpdate) {
          setIsPolling(true)
        }

        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("pendencias").select("*").order("data", { ascending: false })

        if (error) throw error

        if (isMountedRef.current) {
          const newDataHash = generateDataHash(data || [])
          const hasChanges = newDataHash !== lastDataHashRef.current

          if (hasChanges || !isPollingUpdate) {
            setPendencias(data || [])
            setLastUpdate(new Date())
            lastDataHashRef.current = newDataHash

            if (isPollingUpdate && hasChanges && showPollingToasts) {
              toast({
                title: "🔄 Dados atualizados",
                description: "Lista de pendências sincronizada automaticamente",
                duration: 2000,
              })
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar pendências:", error)
        if (isMountedRef.current && !isPollingUpdate) {
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar as pendências",
            variant: "destructive",
            duration: 3000,
          })
        }
      } finally {
        if (isPollingUpdate) {
          setIsPolling(false)
        }
      }
    },
    [generateDataHash, showPollingToasts, toast],
  )

  // Configurar Supabase Realtime
  const setupRealtime = useCallback(() => {
    if (!enableRealtime) return

    try {
      const supabase = getSupabaseClient()

      const channel = supabase
        .channel("pendencias-realtime-updates")
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

                // Atualizar hash
                lastDataHashRef.current = generateDataHash(updated)
                return updated
              })

              toast({
                title: "✅ Nova pendência",
                description: `"${newPendencia.titulo}" foi adicionada`,
                duration: 3000,
              })
            } else if (payload.eventType === "UPDATE" && payload.new) {
              const updatedPendencia = payload.new as Pendencia
              setPendencias((prev) => {
                const updated = prev.map((p) => (p.id === updatedPendencia.id ? updatedPendencia : p))
                lastDataHashRef.current = generateDataHash(updated)
                return updated
              })

              toast({
                title: "📝 Pendência atualizada",
                description: `"${updatedPendencia.titulo}" foi modificada`,
                duration: 3000,
              })
            } else if (payload.eventType === "DELETE" && payload.old) {
              const deletedId = (payload.old as any).id
              setPendencias((prev) => {
                const updated = prev.filter((p) => p.id !== deletedId)
                lastDataHashRef.current = generateDataHash(updated)
                return updated
              })

              toast({
                title: "🗑️ Pendência removida",
                description: "Uma pendência foi removida",
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
                title: "Conexão instável",
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
  }, [enableRealtime, toast, generateDataHash])

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
        console.log("🔄 Polling automático: verificando atualizações...")
        fetchPendencias(true) // Indicar que é uma atualização de polling
      }
    }, pollingInterval)

    console.log(`⏰ Polling configurado para ${pollingInterval / 1000} segundos`)
  }, [enablePolling, pollingInterval, fetchPendencias])

  // Função para forçar atualização manual
  const forceRefresh = useCallback(async () => {
    setIsLoading(true)
    await fetchPendencias(false)
    setIsLoading(false)
  }, [fetchPendencias])

  // Função para adicionar pendência com atualização otimista
  const addPendenciaOptimistic = useCallback(
    async (novaPendencia: Omit<Pendencia, "id">) => {
      try {
        const supabase = getSupabaseClient()

        // Inserir no banco - deixar o Supabase gerar o ID automaticamente
        const { data, error } = await supabase
          .from("pendencias")
          .insert([
            {
              titulo: novaPendencia.titulo,
              descricao: novaPendencia.descricao,
              status: novaPendencia.status,
              urgente: novaPendencia.urgente,
              data: novaPendencia.data,
              author: novaPendencia.author,
            },
          ])
          .select()
          .single()

        if (error) {
          console.error("Erro detalhado ao inserir:", error)
          throw error
        }

        // Se realtime não estiver conectado, atualizar manualmente
        if (!isConnected && data) {
          setPendencias((prev) => {
            // Verificar se já existe para evitar duplicatas
            const exists = prev.some((p) => p.id === data.id)
            if (exists) return prev

            const updated = [data, ...prev].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            lastDataHashRef.current = generateDataHash(updated)
            return updated
          })
          setLastUpdate(new Date())
        }

        return data
      } catch (error) {
        console.error("Erro ao adicionar pendência:", error)
        throw error
      }
    },
    [isConnected, generateDataHash],
  )

  // Função para atualizar status com atualização otimista
  const updateStatusOptimistic = useCallback(
    async (id: number, novoStatus: string) => {
      // Backup do estado atual
      const previousPendencias = [...pendencias]

      try {
        // Atualização otimista local
        setPendencias((prev) => {
          const updated = prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
          lastDataHashRef.current = generateDataHash(updated)
          return updated
        })

        const supabase = getSupabaseClient()
        const { error } = await supabase.from("pendencias").update({ status: novoStatus }).eq("id", id)

        if (error) {
          // Reverter em caso de erro
          setPendencias(previousPendencias)
          lastDataHashRef.current = generateDataHash(previousPendencias)
          throw error
        }

        setLastUpdate(new Date())
      } catch (error) {
        console.error("Erro ao atualizar status:", error)
        throw error
      }
    },
    [pendencias, generateDataHash],
  )

  // Função para remover pendência com atualização otimista
  const removePendenciaOptimistic = useCallback(
    async (id: number) => {
      // Backup do estado atual
      const previousPendencias = [...pendencias]

      try {
        // Atualização otimista local
        setPendencias((prev) => {
          const updated = prev.filter((p) => p.id !== id)
          lastDataHashRef.current = generateDataHash(updated)
          return updated
        })

        const supabase = getSupabaseClient()
        const { error } = await supabase.from("pendencias").delete().eq("id", id)

        if (error) {
          // Reverter em caso de erro
          setPendencias(previousPendencias)
          lastDataHashRef.current = generateDataHash(previousPendencias)
          throw error
        }

        setLastUpdate(new Date())
      } catch (error) {
        console.error("Erro ao remover pendência:", error)
        throw error
      }
    },
    [pendencias, generateDataHash],
  )

  // Inicialização
  useEffect(() => {
    isMountedRef.current = true

    const initialize = async () => {
      setIsLoading(true)
      await fetchPendencias(false)
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
    isPolling,
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
