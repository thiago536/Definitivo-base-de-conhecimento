import { createClient } from "@supabase/supabase-js"

// Types for our database tables
export type FAQ = {
  id: number
  title: string
  category: string
  description: string
  author?: string
  images?: any[]
  created_at: string
}

export type Pendencia = {
  id: number
  titulo: string
  descricao: string
  status: "nao-concluido" | "em-andamento" | "concluido"
  urgente: boolean
  data: string
  author?: string
}

export type Acesso = {
  id: number
  posto: string
  maquina: string
  usuario: string
  senha: string
  adquirente: string
  trabalho_andamento: string
  status_maquininha: string
  expandido?: boolean
}

export type Author = {
  id: number
  name: string
  created_at: string
}

// Create a single supabase client for the browser
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
    throw new Error("Supabase URL is required. Please check your environment variables.")
  }

  if (!supabaseAnonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
    throw new Error("Supabase Anon Key is required. Please check your environment variables.")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
}

// Create a server-side Supabase client
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error("Missing SUPABASE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable")
    throw new Error("Supabase URL is required for server client. Please check your environment variables.")
  }

  if (!supabaseServiceKey) {
    console.error("Missing SUPABASE_SUPABASE_SERVICE_ROLE_KEY environment variable")
    throw new Error("Supabase Service Role Key is required for server client. Please check your environment variables.")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}
