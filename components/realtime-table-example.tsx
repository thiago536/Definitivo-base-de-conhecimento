"use client"
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface ExampleItem {
  id: number
  title: string
  description: string
  created_at: string
  [key: string]: any
}

interface RealtimeTableExampleProps {
  table: "faqs" | "acessos" | "authors" | "pendencias"
  title: string
  displayFields: string[]
}

export function RealtimeTableExample({ table, title, displayFields }: RealtimeTableExampleProps) {
  const { toast } = useToast()

  // Usar o hook personalizado para gerenciar dados em tempo real
  const { data, isLoading, isConnected, error } = useSupabaseRealtime<ExampleItem>({
    table,
    onInsert: (item) => {
      toast({
        title: "Novo item adicionado",
        description: `${item.title || item.name || "Item"} foi adicionado à tabela ${table}`,
      })
    },
    onUpdate: (item) => {
      toast({
        title: "Item atualizado",
        description: `${item.title || item.name || "Item"} foi atualizado na tabela ${table}`,
      })
    },
    onDelete: (id) => {
      toast({
        title: "Item removido",
        description: `Um item foi removido da tabela ${table}`,
      })
    },
  })

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge variant="destructive">Erro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro ao carregar dados: {error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={isConnected ? "success" : "secondary"}>{isConnected ? "Conectado" : "Desconectado"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-2">
            {data.slice(0, 5).map((item) => (
              <div key={item.id} className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                {displayFields.map((field) => (
                  <div key={field} className="mb-1">
                    <span className="font-medium">{field}: </span>
                    <span>{String(item[field] || "N/A")}</span>
                  </div>
                ))}
              </div>
            ))}
            {data.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">Mostrando 5 de {data.length} itens</p>
            )}
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">Nenhum dado encontrado</p>
        )}
      </CardContent>
    </Card>
  )
}
