"use client"

import { useEffect, createContext, useContext, useState, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { FAQData, Autor } from "@/lib/store"
import type { Pendencia, Acesso } from "@/lib/supabase"

// Tipos para o contexto
interface RealtimeContextType {
  faqs: FAQData[]
  acessos: Acesso[]
  autores: Autor[]
  pendencias: Pendencia[]
  isConnected: boolean
  isLoading: boolean
}

// Criar contexto
const RealtimeContext = createContext<RealtimeContextType | null>(null)

// Hook para usar o contexto
export const useRealtimeData = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtimeData deve ser usado dentro de um RealtimeDataProvider")
  }
  return context
}

export function RealtimeDataProvider({ children }: { children: ReactNode }) {
  // Estados para armazenar dados
  const [faqs, setFaqs] = useState<FAQData[]>([])
  const [acessos, setAcessos] = useState<Acesso[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let channels: any[] = []
    let isMounted = true

    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseClient()

        // Buscar dados iniciais de todas as tabelas em paralelo
        const [faqsResponse, acessosResponse, autoresResponse, pendenciasResponse] = await Promise.all([
          supabase.from("faqs").select("*").order("created_at", { ascending: false }),
          supabase.from("acessos").select("*").order("created_at", { ascending: false }),
          supabase.from("authors").select("*").order("name", { ascending: true }),
          supabase.from("pendencias").select("*").order("data", { ascending: false }),
        ])

        // Verificar erros
        if (faqsResponse.error) throw new Error(`Erro ao buscar FAQs: ${faqsResponse.error.message}`)
        if (acessosResponse.error) throw new Error(`Erro ao buscar acessos: ${acessosResponse.error.message}`)
        if (autoresResponse.error) throw new Error(`Erro ao buscar autores: ${autoresResponse.error.message}`)
        if (pendenciasResponse.error) throw new Error(`Erro ao buscar pendências: ${pendenciasResponse.error.message}`)

        // Atualizar estados se o componente ainda estiver montado
        if (isMounted) {
          // Transformar dados conforme necessário
          const transformedFaqs = faqsResponse.data.map((faq: any) => ({
            id: faq.id,
            title: faq.title,
            category: faq.category,
            description: faq.description,
            author: faq.author,
            images: Array.isArray(faq.images) ? faq.images : [],
          }))

          const transformedAcessos = acessosResponse.data.map((acesso: any) => ({
            id: acesso.id,
            posto: acesso.posto,
            maquina: acesso.maquina,
            usuario: acesso.usuario,
            senha: acesso.senha,
            adquirente: acesso.adquirente || "",
            trabalhoAndamento: acesso.trabalho_andamento || "",
            statusMaquininha: acesso.status_maquininha || "",
            expandido: false,
          }))

          const transformedAutores = autoresResponse.data.map((autor: any) => ({
            id: autor.id,
            name: autor.name,
          }))

          // Atualizar estados
          setFaqs(transformedFaqs)
          setAcessos(transformedAcessos)
          setAutores(transformedAutores)
          setPendencias(pendenciasResponse.data)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Erro ao buscar dados iniciais:", err)
        if (isMounted) {
          toast({
            title: "Erro ao carregar dados",
            description: err instanceof Error ? err.message : "Ocorreu um erro ao carregar os dados",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    }

    const setupRealtimeSubscriptions = () => {
      try {
        const supabase = getSupabaseClient()

        // Configurar canal para FAQs
        const faqsChannel = supabase
          .channel("faqs-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "faqs",
            },
            async (payload) => {
              if (!isMounted) return

              console.log("FAQs realtime event:", payload.eventType, payload)

              // Buscar dados atualizados após qualquer mudança
              const { data, error } = await supabase.from("faqs").select("*").order("created_at", { ascending: false })

              if (error) {
                console.error("Erro ao atualizar FAQs:", error)
                return
              }

              // Transformar e atualizar dados
              const transformedFaqs = data.map((faq: any) => ({
                id: faq.id,
                title: faq.title,
                category: faq.category,
                description: faq.description,
                author: faq.author,
                images: Array.isArray(faq.images) ? faq.images : [],
              }))

              setFaqs(transformedFaqs)

              // Notificar usuário sobre a mudança
              toast({
                title: `FAQ ${payload.eventType === "INSERT" ? "adicionado" : payload.eventType === "UPDATE" ? "atualizado" : "removido"}`,
                description:
                  payload.eventType === "DELETE"
                    ? "Um FAQ foi removido da base de conhecimento"
                    : `${(payload.new as any).title}`,
                duration: 3000,
              })
            },
          )
          .subscribe()

        // Configurar canal para acessos
        const acessosChannel = supabase
          .channel("acessos-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "acessos",
            },
            async (payload) => {
              if (!isMounted) return

              console.log("Acessos realtime event:", payload.eventType, payload)

              // Buscar dados atualizados após qualquer mudança
              const { data, error } = await supabase
                .from("acessos")
                .select("*")
                .order("created_at", { ascending: false })

              if (error) {
                console.error("Erro ao atualizar acessos:", error)
                return
              }

              // Transformar e atualizar dados
              const transformedAcessos = data.map((acesso: any) => ({
                id: acesso.id,
                posto: acesso.posto,
                maquina: acesso.maquina,
                usuario: acesso.usuario,
                senha: acesso.senha,
                adquirente: acesso.adquirente || "",
                trabalhoAndamento: acesso.trabalho_andamento || "",
                statusMaquininha: acesso.status_maquininha || "",
                expandido: false,
              }))

              setAcessos(transformedAcessos)

              // Notificar usuário sobre a mudança
              toast({
                title: `Acesso ${payload.eventType === "INSERT" ? "adicionado" : payload.eventType === "UPDATE" ? "atualizado" : "removido"}`,
                description:
                  payload.eventType === "DELETE"
                    ? "Um acesso foi removido do sistema"
                    : `${(payload.new as any).posto} - ${(payload.new as any).maquina}`,
                duration: 3000,
              })
            },
          )
          .subscribe()

        // Configurar canal para autores
        const autoresChannel = supabase
          .channel("authors-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "authors",
            },
            async (payload) => {
              if (!isMounted) return

              console.log("Autores realtime event:", payload.eventType, payload)

              // Buscar dados atualizados após qualquer mudança
              const { data, error } = await supabase.from("authors").select("*").order("name", { ascending: true })

              if (error) {
                console.error("Erro ao atualizar autores:", error)
                return
              }

              // Transformar e atualizar dados
              const transformedAutores = data.map((autor: any) => ({
                id: autor.id,
                name: autor.name,
              }))

              setAutores(transformedAutores)

              // Notificar usuário sobre a mudança
              toast({
                title: `Autor ${payload.eventType === "INSERT" ? "adicionado" : payload.eventType === "UPDATE" ? "atualizado" : "removido"}`,
                description:
                  payload.eventType === "DELETE" ? "Um autor foi removido do sistema" : `${(payload.new as any).name}`,
                duration: 3000,
              })
            },
          )
          .subscribe()

        // Configurar canal para pendências
        const pendenciasChannel = supabase
          .channel("pendencias-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "pendencias",
            },
            async (payload) => {
              if (!isMounted) return

              console.log("Pendencias realtime event:", payload.eventType, payload)

              // Buscar dados atualizados após qualquer mudança
              const { data, error } = await supabase.from("pendencias").select("*").order("data", { ascending: false })

              if (error) {
                console.error("Erro ao atualizar pendências:", error)
                return
              }

              setPendencias(data)

              // Notificar usuário sobre a mudança
              toast({
                title: `Pendência ${payload.eventType === "INSERT" ? "adicionada" : payload.eventType === "UPDATE" ? "atualizada" : "removida"}`,
                description:
                  payload.eventType === "DELETE"
                    ? "Uma pendência foi removida do sistema"
                    : `${(payload.new as any).titulo}`,
                duration: 3000,
              })
            },
          )
          .subscribe()

        // Armazenar canais para limpeza posterior
        channels = [faqsChannel, acessosChannel, autoresChannel, pendenciasChannel]
        setIsConnected(true)

        // Notificar usuário sobre conexão estabelecida
        toast({
          title: "Conexão em tempo real estabelecida",
          description: "Você receberá atualizações automáticas quando houver mudanças nos dados",
          duration: 3000,
        })
      } catch (err) {
        console.error("Erro ao configurar inscrições em tempo real:", err)
        toast({
          title: "Erro na conexão em tempo real",
          description: "Não foi possível estabelecer conexão para atualizações em tempo real",
          variant: "destructive",
        })
      }
    }

    // Inicializar dados e configurar inscrições
    fetchInitialData().then(() => {
      if (isMounted) {
        setupRealtimeSubscriptions()
      }
    })

    // Limpeza ao desmontar o componente
    return () => {
      isMounted = false

      // Remover todos os canais
      if (channels.length > 0) {
        const supabase = getSupabaseClient()
        channels.forEach((channel) => {
          supabase.removeChannel(channel)
        })
      }
    }
  }, [toast])

  // Fornecer dados através do contexto
  return (
    <RealtimeContext.Provider
      value={{
        faqs,
        acessos,
        autores,
        pendencias,
        isConnected,
        isLoading,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}
