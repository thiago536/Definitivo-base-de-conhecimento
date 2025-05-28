"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"

interface TableStatus {
  name: string
  status: "checking" | "success" | "error"
  count?: number
  error?: string
}

export function DatabaseHealthCheck() {
  const [tables, setTables] = useState<TableStatus[]>([
    { name: "faqs", status: "checking" },
    { name: "acessos", status: "checking" },
    { name: "authors", status: "checking" },
    { name: "pendencias", status: "checking" },
    { name: "speds", status: "checking" },
  ])
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  const checkTableHealth = async (tableName: string): Promise<TableStatus> => {
    try {
      const supabase = getSupabaseClient()
      const { data, error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true })

      if (error) {
        return {
          name: tableName,
          status: "error",
          error: error.message,
        }
      }

      return {
        name: tableName,
        status: "success",
        count: count || 0,
      }
    } catch (error) {
      return {
        name: tableName,
        status: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  const runHealthCheck = async () => {
    setIsChecking(true)

    // Reset all tables to checking status
    setTables((prev) => prev.map((table) => ({ ...table, status: "checking" as const })))

    try {
      // Check all tables in parallel
      const results = await Promise.all(tables.map((table) => checkTableHealth(table.name)))

      setTables(results)

      const successCount = results.filter((r) => r.status === "success").length
      const errorCount = results.filter((r) => r.status === "error").length

      if (errorCount === 0) {
        toast({
          title: "Verificação concluída com sucesso",
          description: `Todas as ${successCount} tabelas estão funcionando corretamente`,
        })
      } else {
        toast({
          title: "Problemas detectados",
          description: `${errorCount} tabela(s) com problemas, ${successCount} funcionando`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro na verificação de saúde:", error)
      toast({
        title: "Erro na verificação",
        description: "Não foi possível completar a verificação de saúde",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Run initial health check
  useEffect(() => {
    runHealthCheck()
  }, [])

  const getStatusIcon = (status: TableStatus["status"]) => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TableStatus["status"]) => {
    switch (status) {
      case "checking":
        return <Badge variant="secondary">Verificando...</Badge>
      case "success":
        return <Badge variant="success">OK</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Saúde do Banco de Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Tabelas */}
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                {getStatusIcon(table.status)}
                <span className="text-sm font-medium capitalize">{table.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {table.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{table.count} registros</span>
                )}
                {getStatusBadge(table.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Erros */}
        {tables.some((t) => t.status === "error") && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600">Erros Detectados:</h4>
            {tables
              .filter((t) => t.status === "error")
              .map((table) => (
                <div key={table.name} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <strong>{table.name}:</strong> {table.error}
                </div>
              ))}
          </div>
        )}

        {/* Botão de Verificação */}
        <Button onClick={runHealthCheck} disabled={isChecking} variant="outline" size="sm" className="w-full">
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Novamente"
          )}
        </Button>

        {/* Resumo */}
        <div className="text-xs text-muted-foreground">
          <p>• Verifica conectividade com todas as tabelas</p>
          <p>• Conta registros em cada tabela</p>
          <p>• Detecta problemas de permissão</p>
        </div>
      </CardContent>
    </Card>
  )
}
