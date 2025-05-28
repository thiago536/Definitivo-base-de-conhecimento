"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Zap } from "lucide-react"

interface ActivityItem {
  id: string
  title: string
  description?: string
  type: "faq" | "pendencia" | "acesso" | "sped" | "system"
  timestamp: Date
  author?: string
  isNew?: boolean
}

interface RealTimeActivityListProps {
  activities?: ActivityItem[]
  maxItems?: number
  showConnectionStatus?: boolean
}

const activityTypeConfig = {
  faq: { label: "FAQ", color: "bg-blue-500", icon: "📚" },
  pendencia: { label: "Pendência", color: "bg-orange-500", icon: "✅" },
  acesso: { label: "Acesso", color: "bg-green-500", icon: "🔑" },
  sped: { label: "SPED", color: "bg-purple-500", icon: "📊" },
  system: { label: "Sistema", color: "bg-gray-500", icon: "⚙️" },
}

// Sample data for demonstration
const sampleActivities: ActivityItem[] = [
  {
    id: "1",
    title: "Novo FAQ adicionado",
    description: "Como configurar PDV para nova loja",
    type: "faq",
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    author: "João Silva",
    isNew: true,
  },
  {
    id: "2",
    title: "Pendência atualizada",
    description: "Atualizar sistema do Posto Central - Status: Em andamento",
    type: "pendencia",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    author: "Maria Santos",
  },
  {
    id: "3",
    title: "Novo acesso cadastrado",
    description: "PDV-011 - Posto Leste Total",
    type: "acesso",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    author: "Pedro Oliveira",
  },
  {
    id: "4",
    title: "SPED gerado",
    description: "3 SPEDs processados com sucesso",
    type: "sped",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    author: "Ana Costa",
  },
  {
    id: "5",
    title: "Sistema atualizado",
    description: "Backup automático executado",
    type: "system",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
]

export function RealTimeActivityList({
  activities = sampleActivities,
  maxItems = 10,
  showConnectionStatus = true,
}: RealTimeActivityListProps) {
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>(activities.slice(0, maxItems))
  const [isConnected, setIsConnected] = useState(true)

  // Simulate real-time connection status
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would check actual connection status
      setIsConnected((prev) => prev) // Keep connected for demo
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora mesmo"
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  // Function to add new activity (for future real-time integration)
  const addNewActivity = (newActivity: ActivityItem) => {
    setDisplayedActivities((prev) => [{ ...newActivity, isNew: true }, ...prev.slice(0, maxItems - 1)])

    // Remove the "new" flag after animation
    setTimeout(() => {
      setDisplayedActivities((prev) =>
        prev.map((activity) => (activity.id === newActivity.id ? { ...activity, isNew: false } : activity)),
      )
    }, 2000)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Atividade em Tempo Real
          </CardTitle>

          {showConnectionStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs text-muted-foreground">{isConnected ? "Conectado" : "Desconectado"}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>Novos itens aparecem no topo</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity, index) => {
            const config = activityTypeConfig[activity.type]

            return (
              <div
                key={activity.id}
                className={`
                  transition-all duration-500 ease-out
                  ${activity.isNew ? "animate-in slide-in-from-top-2 fade-in-0 duration-500" : ""}
                `}
              >
                <Card
                  className={`
                  border transition-all duration-300
                  ${activity.isNew ? "border-blue-200 bg-blue-50/50 shadow-md" : "border-border hover:border-blue-200"}
                `}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Activity Type Indicator */}
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
                        ${config.color}
                      `}
                      >
                        {config.icon}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">{activity.title}</h4>
                          {activity.isNew && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Novo
                            </Badge>
                          )}
                        </div>

                        {activity.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{activity.description}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(activity.timestamp)}</span>
                          </div>

                          {activity.author && <span className="truncate max-w-20">{activity.author}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        )}

        {/* Loading placeholder for new items */}
        <div className="opacity-0 pointer-events-none">
          <Card className="border-dashed border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
