"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Wifi, WifiOff, Activity, Database, Zap } from "lucide-react"

export function RealtimeStatusIndicator() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [lastActivity, setLastActivity] = useState<Date | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let channel: any = null
    let isMounted = true

    const setupConnection = () => {
      try {
        const supabase = getSupabaseClient()

        // Criar um canal de teste para verificar a conectividade
        channel = supabase
          .channel("realtime-status-test")
          .on("presence", { event: "sync" }, () => {
            if (isMounted) {
              setLastActivity(new Date())
              setConnectionCount((prev) => prev + 1)
            }
          })
          .subscribe((status) => {
            console.log("Realtime connection status:", status)
            if (isMounted) {
              setIsConnected(status === "SUBSCRIBED")
              if (status === "SUBSCRIBED") {
                setLastActivity(new Date())
                toast({
                  title: "Conexão em tempo real estabelecida",
                  description: "Sistema pronto para receber atualizações automáticas",
                  duration: 3000,
                })
              } else if (status === "CHANNEL_ERROR") {
                toast({
                  title: "Erro na conexão em tempo real",
                  description: "Verifique sua conexão com a internet",
                  variant: "destructive",
                })
              }
            }
          })
      } catch (error) {
        console.error("Erro ao configurar conexão em tempo real:", error)
        if (isMounted) {
          toast({
            title: "Erro de configuração",
            description: "Não foi possível configurar a conexão em tempo real",
            variant: "destructive",
          })
        }
      }
    }

    setupConnection()

    return () => {
      isMounted = false
      if (channel) {
        const supabase = getSupabaseClient()
        supabase.removeChannel(channel)
      }
    }
  }, [toast])

  const testConnection = async () => {
    try {
      const supabase = getSupabaseClient()

      // Corrigido: Usando a sintaxe correta para contar registros no Supabase
      const { data, error } = await supabase.from("authors").select("*", { count: "exact", head: true }).limit(1)

      if (error) throw error

      toast({
        title: "Teste de conexão bem-sucedido",
        description: "A conexão com o banco de dados está funcionando",
      })

      setLastActivity(new Date())
    } catch (error) {
      console.error("Erro no teste de conexão:", error)
      toast({
        title: "Falha no teste de conexão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Status do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <span className="text-sm font-medium">Tempo Real</span>
          </div>
          <Badge variant={isConnected ? "success" : "destructive"}>{isConnected ? "Conectado" : "Desconectado"}</Badge>
        </div>

        {/* Contador de Conexões */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Eventos</span>
          </div>
          <Badge variant="outline">{connectionCount}</Badge>
        </div>

        {/* Última Atividade */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Última Atividade</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {lastActivity ? lastActivity.toLocaleTimeString() : "Nenhuma"}
          </span>
        </div>

        {/* Botão de Teste */}
        <Button onClick={testConnection} variant="outline" size="sm" className="w-full">
          Testar Conexão
        </Button>

        {/* Informações Adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Atualizações automáticas ativas</p>
          <p>• Notificações em tempo real</p>
          <p>• Sincronização de dados</p>
        </div>
      </CardContent>
    </Card>
  )
}
