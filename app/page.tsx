"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, CheckSquare, Key } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useRealtimeData } from "@/components/realtime-data-provider"

export default function Dashboard() {
  const router = useRouter()
  const { addFaq, addPendencia, addAcesso } = useAppStore()
  const [dailyPassword, setDailyPassword] = useState("")

  // Use the realtime data provider instead of individual hooks
  const { faqs, pendencias, acessos, autores, isLoading, isConnected } = useRealtimeData()

  // Calcular a senha diária
  useEffect(() => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const dateNumber = Number.parseInt(`${day}${month}`)

    const division = dateNumber / 8369
    const decimalPart = division.toString().split(".")[1] || "0000"
    const password = decimalPart.substring(0, 4).replace(/^0+/, "") || "0"

    setDailyPassword(password)
  }, [])

  // Estatísticas
  const stats = [
    {
      title: "FAQs",
      value: faqs?.length || 0,
      description: "Base de conhecimento",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pendências",
      value: pendencias?.length || 0,
      description: "Tarefas em aberto",
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Acessos",
      value: acessos?.length || 0,
      description: "Credenciais gerenciadas",
      icon: Key,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Autores",
      value: autores?.length || 0,
      description: "Colaboradores ativos",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  // Ações rápidas
  const quickActions = [
    {
      title: "Novo FAQ",
      description: "Adicionar conhecimento",
      icon: BookOpen,
      action: () => router.push("/base-conhecimento"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Nova Pendência",
      description: "Criar tarefa",
      icon: CheckSquare,
      action: () => router.push("/pendencias"),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Novo Acesso",
      description: "Gerenciar credenciais",
      icon: Key,
      action: () => router.push("/acessos"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ]

  // Atividades recentes (últimos 5 itens de cada tipo)
  const recentFaqs = faqs?.slice(0, 3) || []
  const recentPendencias = pendencias?.slice(0, 3) || []
  const recentAcessos = acessos?.slice(0, 3) || []

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex justify-center items-center py-12">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <span className="ml-4 text-lg">Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard E-PROSYS</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              Senha diária: <span className="font-bold text-primary">{dailyPassword}</span>
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-muted-foreground">{isConnected ? "Conectado" : "Desconectado"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={action.action}
                >
                  <div className={`p-3 rounded-md ${action.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Atividades Recentes */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* FAQs Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              FAQs Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentFaqs.length > 0 ? (
              recentFaqs.map((faq) => (
                <div key={faq.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
                  <div className="font-medium text-sm line-clamp-1">{faq.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {faq.category} • {faq.author || "Sem autor"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum FAQ encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pendências Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Pendências Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPendencias.length > 0 ? (
              recentPendencias.map((pendencia) => (
                <div key={pendencia.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm line-clamp-1">{pendencia.titulo}</div>
                    {pendencia.urgente && (
                      <Badge variant="destructive" className="text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pendencia.status === "nao-concluido" && "Não concluído"}
                    {pendencia.status === "em-andamento" && "Em andamento"}
                    {pendencia.status === "concluido" && "Concluído"}
                    {pendencia.author && ` • ${pendencia.author}`}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma pendência encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acessos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Acessos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAcessos.length > 0 ? (
              recentAcessos.map((acesso) => (
                <div key={acesso.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/50">
                  <div className="font-medium text-sm line-clamp-1">{acesso.posto}</div>
                  <div className="text-xs text-muted-foreground">
                    {acesso.maquina} • {acesso.usuario}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum acesso encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
