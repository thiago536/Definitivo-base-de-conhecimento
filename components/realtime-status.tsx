"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2 } from "lucide-react"

interface RealtimeStatusProps {
  isConnected: boolean
  isLoading: boolean
  tableName: string
}

export function RealtimeStatus({ isConnected, isLoading, tableName }: RealtimeStatusProps) {
  if (isLoading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Conectando...
      </Badge>
    )
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
        <Wifi className="h-3 w-3" />
        {tableName} - Tempo Real
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <WifiOff className="h-3 w-3" />
      Desconectado
    </Badge>
  )
}
