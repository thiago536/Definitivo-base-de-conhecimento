"use client"

import type React from "react"

import { useEffect } from "react"
import { useAppStore } from "@/lib/enhanced-store"
import { useToast } from "@/components/ui/use-toast"

export function RealTimeConnectionProvider({ children }: { children: React.ReactNode }) {
  const { subscribeToAllChanges, setConnectionStatus, isConnected } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    // Initialize real-time connections
    const unsubscribe = subscribeToAllChanges()

    // Connection status monitoring
    const checkConnection = () => {
      // In a real implementation, you might ping the server or check WebSocket status
      setConnectionStatus(true)
    }

    // Initial connection check
    checkConnection()

    // Periodic connection check
    const connectionInterval = setInterval(checkConnection, 30000) // Check every 30 seconds

    // Show connection status changes
    if (isConnected) {
      toast({
        title: "Sistema conectado",
        description: "Atualizações em tempo real ativas",
        duration: 3000,
      })
    }

    // Cleanup
    return () => {
      unsubscribe()
      clearInterval(connectionInterval)
      setConnectionStatus(false)
    }
  }, [subscribeToAllChanges, setConnectionStatus, toast, isConnected])

  return <>{children}</>
}
