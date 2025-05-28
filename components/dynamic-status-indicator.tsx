"use client"

import { WifiOff, RefreshCw, Clock, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DynamicStatusIndicatorProps {
  isConnected: boolean
  isLoading: boolean
  lastUpdate: Date
  onForceRefresh: () => void
  pollingInterval: number
  enableRealtime: boolean
  enablePolling: boolean
}

export function DynamicStatusIndicator({
  isConnected,
  isLoading,
  lastUpdate,
  onForceRefresh,
  pollingInterval,
  enableRealtime,
  enablePolling,
}: DynamicStatusIndicatorProps) {
  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) {
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
      <div className="flex items-center gap-2">
        {/* Status da Conexão Realtime */}
        {enableRealtime && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  isConnected
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
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
                    Desconectado
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isConnected
                  ? "Conectado ao Supabase Realtime - Atualizações instantâneas ativas"
                  : "Desconectado do Realtime - Usando apenas polling automático"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Status do Polling */}
        {enablePolling && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {pollingInterval / 1000}s
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualização automática a cada {pollingInterval / 1000} segundos</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Última Atualização */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground">{formatLastUpdate(lastUpdate)}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Última sincronização: {lastUpdate.toLocaleString("pt-BR")}</p>
          </TooltipContent>
        </Tooltip>

        {/* Botão de Atualização Manual */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={onForceRefresh} disabled={isLoading} className="h-6 w-6 p-0">
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Forçar atualização manual</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
