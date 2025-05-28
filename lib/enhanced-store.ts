import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getSupabaseClient } from "./supabase"
import type { Pendencia, Acesso } from "./supabase"

// Enhanced types for real-time activity tracking
export interface ActivityItem {
  id: string
  title: string
  description?: string
  type: "faq" | "pendencia" | "acesso" | "sped" | "author" | "system"
  timestamp: Date
  author?: string
  isNew?: boolean
  action: "created" | "updated" | "deleted"
}

export interface ImageWithMetadata {
  src: string
  title: string
  description: string
}

export interface FAQData {
  id: number
  title: string
  category: string
  description: string
  author?: string
  images?: ImageWithMetadata[]
}

export interface Autor {
  id: number
  name: string
}

export interface SpedData {
  id: number
  date: string
  author: string
  count: number
  created_at?: string
}

export interface DailySpedSummary {
  date: string
  totalCount: number
  byAuthor: {
    [author: string]: number
  }
}

// Enhanced AppState with real-time activity tracking
interface AppState {
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void

  // Real-time activity tracking
  activities: ActivityItem[]
  addActivity: (activity: Omit<ActivityItem, "id" | "timestamp">) => void
  clearActivities: () => void

  // Enhanced real-time subscriptions
  isConnected: boolean
  setConnectionStatus: (status: boolean) => void
  subscribeToAllChanges: () => () => void

  // FAQs with enhanced real-time
  faqs: FAQData[]
  setFaqs: (faqs: FAQData[]) => void
  addFaq: (faq: Omit<FAQData, "id">) => Promise<void>
  updateFaq: (id: number, faq: Partial<FAQData>) => Promise<void>
  deleteFaq: (id: number) => Promise<void>
  getFaqsByCategory: (category: string) => FAQData[]
  addImageToFaq: (faqId: number, image: ImageWithMetadata) => Promise<void>
  subscribeToFaqs: () => () => void

  // Authors with enhanced real-time
  autores: Autor[]
  setAutores: (autores: Autor[]) => void
  addAutor: (nome: string) => Promise<void>
  removeAutor: (id: number) => Promise<void>
  updateAutor: (id: number, nome: string) => Promise<void>
  fetchAutores: () => Promise<void>
  subscribeToAutores: () => () => void

  // Acessos with enhanced real-time
  acessos: Acesso[]
  setAcessos: (acessos: Acesso[]) => void
  addAcesso: (acesso: Omit<Acesso, "id" | "expandido" | "created_at">) => Promise<void>
  updateAcesso: (id: number, acesso: Partial<Acesso>) => Promise<void>
  deleteAcesso: (id: number) => Promise<void>
  subscribeToAcessos: () => () => void

  // Pendências with enhanced real-time
  pendencias: Pendencia[]
  setPendencias: (pendencias: Pendencia[]) => void
  addPendencia: (pendencia: Omit<Pendencia, "id">) => Promise<void>
  updatePendencia: (id: number, pendencia: Partial<Pendencia>) => Promise<void>
  updatePendenciaStatus: (id: number, status: string) => Promise<void>
  deletePendencia: (id: number) => Promise<void>
  subscribeToPendencias: () => () => void

  // SPEDs with enhanced real-time
  speds: SpedData[]
  setSpeds: (speds: SpedData[]) => void
  addSped: (sped: Omit<SpedData, "id" | "created_at">) => Promise<void>
  updateSped: (id: number, sped: Partial<SpedData>) => Promise<void>
  deleteSped: (id: number) => Promise<void>
  resetAllSpeds: () => Promise<void>
  fetchSpeds: () => Promise<void>
  subscribeToSpeds: () => () => void
  getDailySummary: (date: string) => DailySpedSummary
  getSpedsByDateRange: (startDate: string, endDate: string) => SpedData[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      // Real-time activity tracking
      activities: [],
      addActivity: (activity) => {
        const newActivity: ActivityItem = {
          ...activity,
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          isNew: true,
        }

        set((state) => ({
          activities: [newActivity, ...state.activities.slice(0, 49)], // Keep last 50 activities
        }))

        // Remove "new" flag after 3 seconds
        setTimeout(() => {
          set((state) => ({
            activities: state.activities.map((act) => (act.id === newActivity.id ? { ...act, isNew: false } : act)),
          }))
        }, 3000)
      },
      clearActivities: () => set({ activities: [] }),

      // Connection status
      isConnected: false,
      setConnectionStatus: (status) => set({ isConnected: status }),

      // Enhanced subscription to all changes
      subscribeToAllChanges: () => {
        const unsubscribeFaqs = get().subscribeToFaqs()
        const unsubscribeAutores = get().subscribeToAutores()
        const unsubscribeAcessos = get().subscribeToAcessos()
        const unsubscribePendencias = get().subscribeToPendencias()
        const unsubscribeSpeds = get().subscribeToSpeds()

        // Set connection status
        set({ isConnected: true })

        return () => {
          unsubscribeFaqs()
          unsubscribeAutores()
          unsubscribeAcessos()
          unsubscribePendencias()
          unsubscribeSpeds()
          set({ isConnected: false })
        }
      },

      // Enhanced FAQs
      faqs: [],
      setFaqs: (faqs) => set({ faqs }),
      addFaq: async (faq) => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from("faqs")
            .insert({
              title: faq.title,
              category: faq.category,
              description: faq.description,
              author: faq.author || null,
              images: faq.images || null,
            })
            .select()
            .single()

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Novo FAQ adicionado",
            description: faq.title,
            type: "faq",
            author: faq.author,
            action: "created",
          })
        } catch (error) {
          console.error("Error adding FAQ:", error)
          throw error
        }
      },
      updateFaq: async (id, faq) => {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("faqs").update(faq).eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "FAQ atualizado",
            description: faq.title || "FAQ modificado",
            type: "faq",
            author: faq.author,
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating FAQ:", error)
          throw error
        }
      },
      deleteFaq: async (id) => {
        try {
          const supabase = getSupabaseClient()
          const faq = get().faqs.find((f) => f.id === id)
          const { error } = await supabase.from("faqs").delete().eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "FAQ removido",
            description: faq?.title || "FAQ deletado",
            type: "faq",
            author: faq?.author,
            action: "deleted",
          })
        } catch (error) {
          console.error("Error deleting FAQ:", error)
          throw error
        }
      },
      getFaqsByCategory: (category) => {
        const { faqs } = get()
        return category === "all" ? faqs : faqs.filter((faq) => faq.category === category)
      },
      addImageToFaq: async (faqId, image) => {
        try {
          const supabase = getSupabaseClient()
          const { faqs } = get()
          const faq = faqs.find((f) => f.id === faqId)
          if (!faq) return
          const updatedImages = [...(faq.images || []), image]
          const { error } = await supabase.from("faqs").update({ images: updatedImages }).eq("id", faqId)
          if (error) throw error
        } catch (error) {
          console.error("Error adding image to FAQ:", error)
          throw error
        }
      },
      subscribeToFaqs: () => {
        try {
          const supabase = getSupabaseClient()
          const subscription = supabase
            .channel("faqs-changes")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "faqs",
              },
              async (payload) => {
                try {
                  const { data, error } = await supabase
                    .from("faqs")
                    .select("*")
                    .order("created_at", { ascending: false })
                  if (error) {
                    console.error("Error fetching FAQs:", error)
                    return
                  }
                  const transformedFaqs = data.map((faq) => ({
                    id: faq.id,
                    title: faq.title,
                    category: faq.category,
                    description: faq.description,
                    author: faq.author,
                    images: Array.isArray(faq.images) ? faq.images : [],
                  }))
                  set({ faqs: transformedFaqs })
                } catch (err) {
                  console.error("Error in FAQ subscription callback:", err)
                }
              },
            )
            .subscribe()
          return () => {
            try {
              supabase.removeChannel(subscription)
            } catch (err) {
              console.error("Error removing FAQ subscription:", err)
            }
          }
        } catch (error) {
          console.error("Error setting up FAQ subscription:", error)
          return () => {}
        }
      },

      // Enhanced Authors
      autores: [],
      setAutores: (autores) => set({ autores }),
      addAutor: async (nome) => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase.from("authors").insert({ name: nome }).select().single()

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Novo autor adicionado",
            description: nome,
            type: "author",
            action: "created",
          })
        } catch (error) {
          console.error("Error adding author:", error)
          throw error
        }
      },
      updateAutor: async (id, nome) => {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("authors").update({ name: nome }).eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Autor atualizado",
            description: nome,
            type: "author",
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating author:", error)
          throw error
        }
      },
      removeAutor: async (id) => {
        try {
          const supabase = getSupabaseClient()
          const autor = get().autores.find((a) => a.id === id)
          const { error } = await supabase.from("authors").delete().eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Autor removido",
            description: autor?.name || "Autor deletado",
            type: "author",
            action: "deleted",
          })
        } catch (error) {
          console.error("Error removing author:", error)
          throw error
        }
      },
      fetchAutores: async () => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase.from("authors").select("*").order("name", { ascending: true })
          if (error) throw error
          const transformedAutores = data.map((autor) => ({
            id: autor.id,
            name: autor.name,
          }))
          set({ autores: transformedAutores })
        } catch (error) {
          console.error("Error in fetchAutores:", error)
          throw error
        }
      },
      subscribeToAutores: () => {
        try {
          const supabase = getSupabaseClient()
          const subscription = supabase
            .channel("authors-changes")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "authors",
              },
              async () => {
                try {
                  const { data, error } = await supabase.from("authors").select("*").order("name", { ascending: true })
                  if (error) {
                    console.error("Error fetching authors:", error)
                    return
                  }
                  const transformedAutores = data.map((autor) => ({
                    id: autor.id,
                    name: autor.name,
                  }))
                  set({ autores: transformedAutores })
                } catch (err) {
                  console.error("Error in authors subscription callback:", err)
                }
              },
            )
            .subscribe()
          return () => {
            try {
              supabase.removeChannel(subscription)
            } catch (err) {
              console.error("Error removing authors subscription:", err)
            }
          }
        } catch (error) {
          console.error("Error setting up authors subscription:", error)
          return () => {}
        }
      },

      // Enhanced Acessos
      acessos: [],
      setAcessos: (acessos) => set({ acessos }),
      addAcesso: async (acesso) => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from("acessos")
            .insert({
              posto: acesso.posto,
              maquina: acesso.maquina,
              usuario: acesso.usuario,
              senha: acesso.senha,
              adquirente: acesso.adquirente || null,
              trabalho_andamento: (acesso as any).trabalhoAndamento || null,
              status_maquininha: (acesso as any).statusMaquininha || null,
            })
            .select()
            .single()

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Novo acesso cadastrado",
            description: `${acesso.posto} - ${acesso.maquina}`,
            type: "acesso",
            action: "created",
          })
        } catch (error) {
          console.error("Error adding acesso:", error)
          throw error
        }
      },
      updateAcesso: async (id, acesso) => {
        try {
          const supabase = getSupabaseClient()
          const updateData: any = {}
          if (acesso.posto) updateData.posto = acesso.posto
          if (acesso.maquina) updateData.maquina = acesso.maquina
          if (acesso.usuario) updateData.usuario = acesso.usuario
          if (acesso.senha) updateData.senha = acesso.senha
          if (acesso.adquirente) updateData.adquirente = acesso.adquirente
          if ((acesso as any).trabalhoAndamento) updateData.trabalho_andamento = (acesso as any).trabalhoAndamento
          if ((acesso as any).statusMaquininha) updateData.status_maquininha = (acesso as any).statusMaquininha

          const { error } = await supabase.from("acessos").update(updateData).eq("id", id)
          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Acesso atualizado",
            description: `${acesso.posto || "Acesso"} modificado`,
            type: "acesso",
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating acesso:", error)
          throw error
        }
      },
      deleteAcesso: async (id) => {
        try {
          const supabase = getSupabaseClient()
          const acesso = get().acessos.find((a) => a.id === id)
          const { error } = await supabase.from("acessos").delete().eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Acesso removido",
            description: `${acesso?.posto || "Acesso"} deletado`,
            type: "acesso",
            action: "deleted",
          })
        } catch (error) {
          console.error("Error deleting acesso:", error)
          throw error
        }
      },
      subscribeToAcessos: () => {
        try {
          const supabase = getSupabaseClient()
          const subscription = supabase
            .channel("acessos-changes")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "acessos",
              },
              async () => {
                try {
                  const { data, error } = await supabase
                    .from("acessos")
                    .select("*")
                    .order("created_at", { ascending: false })
                  if (error) {
                    console.error("Error fetching acessos:", error)
                    return
                  }
                  const transformedAcessos = data.map(
                    (acesso) =>
                      ({
                        id: acesso.id,
                        posto: acesso.posto,
                        maquina: acesso.maquina,
                        usuario: acesso.usuario,
                        senha: acesso.senha,
                        adquirente: acesso.adquirente || "",
                        trabalhoAndamento: acesso.trabalho_andamento || "",
                        statusMaquininha: acesso.status_maquininha || "",
                        expandido: false,
                      }) as Acesso,
                  )
                  set({ acessos: transformedAcessos })
                } catch (err) {
                  console.error("Error in acessos subscription callback:", err)
                }
              },
            )
            .subscribe()
          return () => {
            try {
              supabase.removeChannel(subscription)
            } catch (err) {
              console.error("Error removing acessos subscription:", err)
            }
          }
        } catch (error) {
          console.error("Error setting up acessos subscription:", error)
          return () => {}
        }
      },

      // Enhanced Pendências
      pendencias: [],
      setPendencias: (pendencias) => set({ pendencias }),
      addPendencia: async (pendencia) => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from("pendencias")
            .insert({
              titulo: pendencia.titulo,
              descricao: pendencia.descricao,
              status: pendencia.status,
              urgente: pendencia.urgente,
              data: pendencia.data,
              author: pendencia.author || null,
            })
            .select()
            .single()

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Nova pendência criada",
            description: pendencia.titulo,
            type: "pendencia",
            author: pendencia.author,
            action: "created",
          })
        } catch (error) {
          console.error("Error adding pendencia:", error)
          throw error
        }
      },
      updatePendencia: async (id, pendencia) => {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("pendencias").update(pendencia).eq("id", id)
          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Pendência atualizada",
            description: pendencia.titulo || "Pendência modificada",
            type: "pendencia",
            author: pendencia.author,
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating pendencia:", error)
          throw error
        }
      },
      updatePendenciaStatus: async (id, status) => {
        try {
          const supabase = getSupabaseClient()
          const pendencia = get().pendencias.find((p) => p.id === id)
          const { error } = await supabase.from("pendencias").update({ status }).eq("id", id)
          if (error) throw error

          // Add activity
          const statusText =
            status === "concluido" ? "concluída" : status === "em-andamento" ? "em andamento" : "pendente"
          get().addActivity({
            title: `Pendência ${statusText}`,
            description: pendencia?.titulo || "Status atualizado",
            type: "pendencia",
            author: pendencia?.author,
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating pendencia status:", error)
          throw error
        }
      },
      deletePendencia: async (id) => {
        try {
          const supabase = getSupabaseClient()
          const pendencia = get().pendencias.find((p) => p.id === id)
          const { error } = await supabase.from("pendencias").delete().eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "Pendência removida",
            description: pendencia?.titulo || "Pendência deletada",
            type: "pendencia",
            author: pendencia?.author,
            action: "deleted",
          })
        } catch (error) {
          console.error("Error deleting pendencia:", error)
          throw error
        }
      },
      subscribeToPendencias: () => {
        try {
          const supabase = getSupabaseClient()
          const subscription = supabase
            .channel("pendencias-changes")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "pendencias",
              },
              async () => {
                try {
                  const { data, error } = await supabase
                    .from("pendencias")
                    .select("*")
                    .order("data", { ascending: false })
                  if (error) {
                    console.error("Error fetching pendencias:", error)
                    return
                  }
                  set({ pendencias: data as Pendencia[] })
                } catch (err) {
                  console.error("Error in pendencias subscription callback:", err)
                }
              },
            )
            .subscribe()
          return () => {
            try {
              supabase.removeChannel(subscription)
            } catch (err) {
              console.error("Error removing pendencias subscription:", err)
            }
          }
        } catch (error) {
          console.error("Error setting up pendencias subscription:", error)
          return () => {}
        }
      },

      // Enhanced SPEDs
      speds: [],
      setSpeds: (speds) => set({ speds }),
      addSped: async (sped) => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase
            .from("speds")
            .insert({
              date: sped.date,
              author: sped.author,
              count: sped.count,
            })
            .select()
            .single()

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "SPED gerado",
            description: `${sped.count} SPED${sped.count !== 1 ? "s" : ""} processado${sped.count !== 1 ? "s" : ""}`,
            type: "sped",
            author: sped.author,
            action: "created",
          })
        } catch (error) {
          console.error("Error adding SPED:", error)
          throw error
        }
      },
      updateSped: async (id, sped) => {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase
            .from("speds")
            .update({
              ...(sped.date && { date: sped.date }),
              ...(sped.author && { author: sped.author }),
              ...(sped.count !== undefined && { count: sped.count }),
            })
            .eq("id", id)
          if (error) throw error

          // Add activity
          get().addActivity({
            title: "SPED atualizado",
            description: "Registro de SPED modificado",
            type: "sped",
            author: sped.author,
            action: "updated",
          })
        } catch (error) {
          console.error("Error updating SPED:", error)
          throw error
        }
      },
      deleteSped: async (id) => {
        try {
          const supabase = getSupabaseClient()
          const sped = get().speds.find((s) => s.id === id)
          const { error } = await supabase.from("speds").delete().eq("id", id)

          if (error) throw error

          // Add activity
          get().addActivity({
            title: "SPED removido",
            description: "Registro de SPED deletado",
            type: "sped",
            author: sped?.author,
            action: "deleted",
          })
        } catch (error) {
          console.error("Error deleting SPED:", error)
          throw error
        }
      },
      resetAllSpeds: async () => {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("speds").delete().neq("id", 0)
          if (error) throw error

          // Add activity
          get().addActivity({
            title: "SPEDs resetados",
            description: "Todos os registros de SPED foram removidos",
            type: "system",
            action: "deleted",
          })
        } catch (error) {
          console.error("Error resetting SPEDs:", error)
          throw error
        }
      },
      fetchSpeds: async () => {
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase.from("speds").select("*").order("date", { ascending: false })
          if (error) throw error
          set({ speds: data as SpedData[] })
        } catch (error) {
          console.error("Error in fetchSpeds:", error)
          throw error
        }
      },
      subscribeToSpeds: () => {
        try {
          const supabase = getSupabaseClient()
          const subscription = supabase
            .channel("speds-changes")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "speds",
              },
              async () => {
                try {
                  const { data, error } = await supabase.from("speds").select("*").order("date", { ascending: false })
                  if (error) {
                    console.error("Error fetching SPEDs:", error)
                    return
                  }
                  set({ speds: data as SpedData[] })
                } catch (err) {
                  console.error("Error in SPEDs subscription callback:", err)
                }
              },
            )
            .subscribe()
          return () => {
            try {
              supabase.removeChannel(subscription)
            } catch (err) {
              console.error("Error removing SPEDs subscription:", err)
            }
          }
        } catch (error) {
          console.error("Error setting up SPEDs subscription:", error)
          return () => {}
        }
      },
      getDailySummary: (date) => {
        const { speds } = get()
        const dailySpeds = speds.filter((sped) => sped.date === date)
        const totalCount = dailySpeds.reduce((sum, sped) => sum + sped.count, 0)
        const byAuthor: { [author: string]: number } = {}
        dailySpeds.forEach((sped) => {
          byAuthor[sped.author] = (byAuthor[sped.author] || 0) + sped.count
        })
        return {
          date,
          totalCount,
          byAuthor,
        }
      },
      getSpedsByDateRange: (startDate, endDate) => {
        const { speds } = get()
        return speds.filter((sped) => {
          const spedDate = new Date(sped.date)
          const start = new Date(startDate)
          const end = new Date(endDate)
          return spedDate >= start && spedDate <= end
        })
      },
    }),
    {
      name: "e-prosys-storage",
      partialize: (state) => {
        const stateToPersist = { ...state }
        // Don't persist real-time data
        delete (stateToPersist as any).activities
        delete (stateToPersist as any).isConnected
        delete (stateToPersist as any).theme
        delete (stateToPersist as any).setTheme
        if (stateToPersist.faqs) {
          stateToPersist.faqs = stateToPersist.faqs.map((faq) => {
            const { images, ...restOfFaq } = faq
            return restOfFaq
          })
        }
        return stateToPersist
      },
    },
  ),
)
