"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageZoomModal } from "@/components/image-zoom-modal"

export default function FaqDetails({ params }) {
  const router = useRouter()
  const { id } = params
  const [faq, setFaq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoomImage, setZoomImage] = useState(null)

  useEffect(() => {
    // Simulação de carregamento de dados
    setTimeout(() => {
      setFaq({
        id: Number.parseInt(id),
        title: "Como configurar o PDV para nova loja",
        category: "pdv",
        description:
          "Passo a passo detalhado para configurar o PDV em uma nova loja:\n\n1. Acesse o painel de administração\n2. Selecione 'Configurações > Novas Lojas'\n3. Preencha os dados da loja\n4. Configure as integrações necessárias\n5. Teste a conexão com o servidor\n6. Realize uma venda teste para validar",
        author: "João Silva",
        images: [
          { src: "/placeholder.svg?height=300&width=500", title: "Imagem 1", description: "Descrição da imagem 1" },
          { src: "/placeholder.svg?height=300&width=500", title: "Imagem 2", description: "Descrição da imagem 2" },
        ],
      })
      setLoading(false)
    }, 500)
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Carregando FAQ...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{faq.title}</h1>
      </div>

      <Card className="flex flex-col max-h-[calc(100vh-150px)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>{faq.title}</CardTitle>
          </div>
          <CardDescription>Categoria: {faq.category === "pdv" ? "PDV" : faq.category}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Descrição</h3>
            <p className="whitespace-pre-line">{faq.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Imagens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faq.images.map((image, index) => (
                <div key={index} className="border rounded-md overflow-hidden group relative">
                  <div className="relative">
                    <img
                      src={image.src || "/placeholder.svg"}
                      alt={image.title || `Imagem ${index + 1} para ${faq.title}`}
                      className="w-full h-auto"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
                      onClick={() => setZoomImage(image)}
                    >
                      <ZoomIn className="h-4 w-4" />
                      <span className="sr-only">Ampliar imagem</span>
                    </Button>
                  </div>
                  {image.title && (
                    <div className="p-3 border-t">
                      <h4 className="font-medium text-sm">{image.title}</h4>
                      {image.description && <p className="text-sm text-muted-foreground mt-1">{image.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Autor</h3>
            <p>{faq.author}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de zoom */}
      <ImageZoomModal
        isOpen={!!zoomImage}
        onClose={() => setZoomImage(null)}
        imageSrc={zoomImage?.src || ""}
        imageTitle={zoomImage?.title}
        imageDescription={zoomImage?.description}
      />
    </div>
  )
}
