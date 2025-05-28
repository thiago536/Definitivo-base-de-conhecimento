"use client"

import { WifiOff, RefreshCw, Clock, Zap, Activity, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"

interface EnhancedStatusIndicatorProps {
  isConnected: boolean
  isLoading: boolean
  isPolling: boolean
  lastUpdate: Date
  onForceRefresh: () => void
  pollingInterval: number
  enableRealtime: boolean
  enablePolling: boolean
  pendenciasCount: number
}

export function EnhancedStatusIndicator({
  isConnected,
  isLoading,
  isPolling,
  lastUpdate,
  onForceRefresh,
  pollingInterval,
  enableRealtime,
  enablePolling,
  pendenciasCount,
}: EnhancedStatusIndicatorProps) {
  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 10) {
      return "agora"
    } else if (diffSeconds < 60) {
      return `${diffSeconds}s atrás`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m atrás`
    } else {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            {/* Status da Conexão */}
            <div className="flex items-center gap-2">
              {enableRealtime && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={isConnected ? "default" : "secondary"}
                      className={`flex items-center gap-1 ${
                        isConnected
                          ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Zap className="h-3 w-3" />
                          Tempo Real
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" />
                          Offline
                        </>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isConnected
                        ? "✅ Conectado ao Supabase Realtime - Atualizações instantâneas ativas"
                        : "⚠️ Desconectado do Realtime - Usando apenas polling automático"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              {enablePolling && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${
                        isPolling ? "animate-pulse bg-blue-50 dark:bg-blue-950" : ""
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {pollingInterval / 1000}s{isPolling && <Activity className="h-3 w-3 animate-spin" />}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      🔄 Atualização automática a cada {pollingInterval / 1000} segundos
                      {isPolling && " (verificando agora...)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Informações Centrais */}
            <div className="flex items-center gap-3 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{pendenciasCount}</span>
                    <span className="text-muted-foreground">{pendenciasCount === 1 ? "pendência" : "pendências"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total de pendências carregadas</p>
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground font-mono">{formatLastUpdate(lastUpdate)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>📅 Última sincronização: {lastUpdate.toLocaleString("pt-BR")}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Botão de Atualização */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onForceRefresh} disabled={isLoading} className="h-8 w-8 p-0">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>🔄 Forçar atualização manual</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
