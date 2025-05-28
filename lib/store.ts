import { create } from "zustand"
import { getSupabaseClient } from "./supabase"

export interface FAQ {
  id: number
  title: string
  category: string
  description: string
  author: string
  images?: any[]
  created_at: string
  updated_at: string
}

export interface Pendencia {
  id: number
  titulo: string
  descricao: string
  status: "pendente" | "em-andamento" | "concluida"
  urgente: boolean
  data: string
  author: string
  created_at: string
  updated_at: string
}

export interface Acesso {
  id: number
  posto: string
  maquina: string
  usuario: string
  senha: string
  adquirente?: string
  trabalho_andamento?: string
  status_maquininha?: string
  created_at: string
  updated_at: string
}

export interface Author {
  id: number
  name: string
  created_at: string
}

export interface Activity {
  id: string
  type: "create" | "update" | "delete"
  table: string
  description: string
  timestamp: string
}

interface AppState {
  // FAQs
  faqs: FAQ[]
  fetchFaqs: () => Promise<void>
  addFaq: (faq: Omit<FAQ, "id" | "created_at" | "updated_at">) => Promise<void>
  updateFaq: (id: number, faq: Partial<FAQ>) => Promise<void>
  deleteFaq: (id: number) => Promise<void>
  subscribeToFaqs: () => () => void

  // Pendências
  pendencias: Pendencia[]
  fetchPendencias: () => Promise<void>
  addPendencia: (pendencia: Omit<Pendencia, "id" | "created_at" | "updated_at">) => Promise<void>
  updatePendencia: (id: number, pendencia: Partial<Pendencia>) => Promise<void>
  deletePendencia: (id: number) => Promise<void>
  subscribeToPendencias: () => () => void

  // Acessos
  acessos: Acesso[]
  fetchAcessos: () => Promise<void>
  addAcesso: (acesso: Omit<Acesso, "id" | "created_at" | "updated_at">) => Promise<void>
  updateAcesso: (id: number, acesso: Partial<Acesso>) => Promise<void>
  deleteAcesso: (id: number) => Promise<void>
  subscribeToAcessos: () => () => void

  // Authors
  autores: Author[]
  fetchAutores: () => Promise<void>
  addAuthor: (author: Omit<Author, "id" | "created_at">) => Promise<void>
  deleteAuthor: (id: number) => Promise<void>
  subscribeToAuthors: () => () => void

  // Activities
  activities: Activity[]
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // FAQs
  faqs: [],
  fetchFaqs: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("faqs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching FAQs:", error)
      throw error
    }

    set({ faqs: data || [] })
  },

  addFaq: async (faq) => {
    const supabase = getSupabaseClient()

    // Prepare clean data object without ID
    const cleanFaqData = {
      title: faq.title,
      category: faq.category,
      description: faq.description || "",
      author: faq.author || null,
      images: faq.images || null,
    }

    console.log("Store: Inserting FAQ data:", cleanFaqData)

    const { data, error } = await supabase.from("faqs").insert(cleanFaqData).select().single()

    if (error) {
      console.error("Store: Error adding FAQ:", error)
      throw error
    }

    console.log("Store: FAQ inserted successfully:", data)

    set((state) => ({
      faqs: [data, ...state.faqs],
    }))

    get().addActivity({
      type: "create",
      table: "faqs",
      description: `FAQ "${faq.title}" foi criado`,
    })
  },

  updateFaq: async (id, faq) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("faqs").update(faq).eq("id", id).select().single()

    if (error) {
      console.error("Error updating FAQ:", error)
      throw error
    }

    set((state) => ({
      faqs: state.faqs.map((f) => (f.id === id ? data : f)),
    }))

    get().addActivity({
      type: "update",
      table: "faqs",
      description: `FAQ "${data.title}" foi atualizado`,
    })
  },

  deleteFaq: async (id) => {
    const supabase = getSupabaseClient()
    const faq = get().faqs.find((f) => f.id === id)
    const { error } = await supabase.from("faqs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting FAQ:", error)
      throw error
    }

    set((state) => ({
      faqs: state.faqs.filter((f) => f.id !== id),
    }))

    get().addActivity({
      type: "delete",
      table: "faqs",
      description: `FAQ "${faq?.title}" foi removido`,
    })
  },

  subscribeToFaqs: () => {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel("faqs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "faqs" }, () => {
        get().fetchFaqs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Pendências
  pendencias: [],
  fetchPendencias: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("pendencias").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pendências:", error)
      throw error
    }

    set({ pendencias: data || [] })
  },

  addPendencia: async (pendencia) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("pendencias")
      .insert([
        {
          titulo: pendencia.titulo,
          descricao: pendencia.descricao,
          status: pendencia.status,
          urgente: pendencia.urgente,
          data: pendencia.data,
          author: pendencia.author,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding pendência:", error)
      throw error
    }

    set((state) => ({
      pendencias: [data, ...state.pendencias],
    }))

    get().addActivity({
      type: "create",
      table: "pendencias",
      description: `Pendência "${pendencia.titulo}" foi criada`,
    })
  },

  updatePendencia: async (id, pendencia) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("pendencias").update(pendencia).eq("id", id).select().single()

    if (error) {
      console.error("Error updating pendência:", error)
      throw error
    }

    set((state) => ({
      pendencias: state.pendencias.map((p) => (p.id === id ? data : p)),
    }))

    get().addActivity({
      type: "update",
      table: "pendencias",
      description: `Pendência "${data.titulo}" foi atualizada`,
    })
  },

  deletePendencia: async (id) => {
    const supabase = getSupabaseClient()
    const pendencia = get().pendencias.find((p) => p.id === id)
    const { error } = await supabase.from("pendencias").delete().eq("id", id)

    if (error) {
      console.error("Error deleting pendência:", error)
      throw error
    }

    set((state) => ({
      pendencias: state.pendencias.filter((p) => p.id !== id),
    }))

    get().addActivity({
      type: "delete",
      table: "pendencias",
      description: `Pendência "${pendencia?.titulo}" foi removida`,
    })
  },

  subscribeToPendencias: () => {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel("pendencias-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pendencias" }, () => {
        get().fetchPendencias()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Acessos
  acessos: [],
  fetchAcessos: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("acessos").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching acessos:", error)
      throw error
    }

    set({ acessos: data || [] })
  },

  addAcesso: async (acesso) => {
    const supabase = getSupabaseClient()

    // Prepare clean data object without ID
    const cleanAcessoData = {
      posto: acesso.posto?.trim() || "",
      maquina: acesso.maquina?.trim() || "",
      usuario: acesso.usuario?.trim() || "",
      senha: acesso.senha?.trim() || "",
      adquirente: acesso.adquirente?.trim() || null,
      trabalho_andamento: acesso.trabalho_andamento?.trim() || null,
      status_maquininha: acesso.status_maquininha?.trim() || null,
    }

    console.log("Store: Inserting acesso data:", cleanAcessoData)

    const { data, error } = await supabase.from("acessos").insert(cleanAcessoData).select().single()

    if (error) {
      console.error("Store: Error adding acesso:", error)
      throw error
    }

    console.log("Store: Acesso inserted successfully:", data)

    set((state) => ({
      acessos: [data, ...state.acessos],
    }))

    get().addActivity({
      type: "create",
      table: "acessos",
      description: `Acesso para "${acesso.posto}" foi criado`,
    })
  },

  updateAcesso: async (id, acesso) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("acessos").update(acesso).eq("id", id).select().single()

    if (error) {
      console.error("Error updating acesso:", error)
      throw error
    }

    set((state) => ({
      acessos: state.acessos.map((a) => (a.id === id ? data : a)),
    }))

    get().addActivity({
      type: "update",
      table: "acessos",
      description: `Acesso para "${data.posto}" foi atualizado`,
    })
  },

  deleteAcesso: async (id) => {
    const supabase = getSupabaseClient()
    const acesso = get().acessos.find((a) => a.id === id)
    const { error } = await supabase.from("acessos").delete().eq("id", id)

    if (error) {
      console.error("Error deleting acesso:", error)
      throw error
    }

    set((state) => ({
      acessos: state.acessos.filter((a) => a.id !== id),
    }))

    get().addActivity({
      type: "delete",
      table: "acessos",
      description: `Acesso para "${acesso?.posto}" foi removido`,
    })
  },

  subscribeToAcessos: () => {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel("acessos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "acessos" }, () => {
        get().fetchAcessos()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Authors
  autores: [],
  fetchAutores: async () => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("authors").select("*").order("name")

    if (error) {
      console.error("Error fetching authors:", error)
      throw error
    }

    set({ autores: data || [] })
  },

  addAuthor: async (author) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from("authors")
      .insert([
        {
          name: author.name,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding author:", error)
      throw error
    }

    set((state) => ({
      autores: [...state.autores, data].sort((a, b) => a.name.localeCompare(b.name)),
    }))

    get().addActivity({
      type: "create",
      table: "authors",
      description: `Autor "${author.name}" foi adicionado`,
    })
  },

  deleteAuthor: async (id) => {
    const supabase = getSupabaseClient()
    const author = get().autores.find((a) => a.id === id)
    const { error } = await supabase.from("authors").delete().eq("id", id)

    if (error) {
      console.error("Error deleting author:", error)
      throw error
    }

    set((state) => ({
      autores: state.autores.filter((a) => a.id !== id),
    }))

    get().addActivity({
      type: "delete",
      table: "authors",
      description: `Autor "${author?.name}" foi removido`,
    })
  },

  subscribeToAuthors: () => {
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel("authors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "authors" }, () => {
        get().fetchAutores()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Activities
  activities: [],
  addActivity: (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 50), // Keep only last 50 activities
    }))
  },
}))
