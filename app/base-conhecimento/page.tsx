"use client"

import { useState, useCallback } from "react"
import { BookOpen, PlusCircle, Search, ZoomIn, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { ImageUpload, type ImageWithMetadata } from "@/components/image-upload"
import { categoryIcons } from "@/components/app-sidebar"
import { ImageZoomModal } from "@/components/image-zoom-modal"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime"
import { RealtimeStatus } from "@/components/realtime-status"

// Dados de exemplo para as categorias
const categories = [
  { id: "gerente", name: "Gerente" },
  { id: "pdv", name: "PDV" },
  { id: "pdv-movel", name: "PDV Móvel" },
  { id: "instalacao", name: "Instalação" },
  { id: "automacao", name: "Automação" },
  { id: "integracao", name: "Integração" },
  { id: "impressoras", name: "Impressoras" },
  { id: "pinpad", name: "PINPAD" },
]

export default function BaseConhecimento() {
  const router = useRouter()
  const { setFaqs, addFaq, autores, fetchAutores, subscribeToAuthors } = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedFaq, setSelectedFaq] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    author: "",
    images: [] as ImageWithMetadata[],
  })

  const {
    data: faqs,
    isLoading,
    isConnected,
    error: realtimeError,
  } = useSupabaseRealtime<any>({
    table: "faqs",
    onInsert: (newFaq) => {
      console.log("✅ Novo FAQ adicionado:", newFaq.title)
      toast({
        title: "Novo FAQ adicionado",
        description: `"${newFaq.title}" foi adicionado à base de conhecimento.`,
      })
    },
    onUpdate: (updatedFaq) => {
      console.log("📝 FAQ atualizado:", updatedFaq.title)
      toast({
        title: "FAQ atualizado",
        description: `"${updatedFaq.title}" foi atualizado.`,
      })
    },
    onDelete: (deletedId) => {
      console.log("🗑️ FAQ removido:", deletedId)
      toast({
        title: "FAQ removido",
        description: "O FAQ foi removido da base de conhecimento.",
      })
    },
  })

  // Carregar autores separadamente
  const fetchAuthors = async () => {
    setIsLoadingAuthors(true)
    try {
      await fetchAutores()
    } catch (error) {
      console.error("Error fetching authors:", error)
      toast({
        title: "Erro ao carregar autores",
        description: "Não foi possível carregar a lista de autores. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
    setIsLoadingAuthors(false)
  }

  const unsubscribeAuthors = subscribeToAuthors()

  // Filtrar FAQs com base na pesquisa e categoria selecionada
  const filteredFaqs = faqs?.filter((faq) => {
    const matchesSearch =
      faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  // Use useCallback to memoize the function
  const handleImagesSelected = useCallback((images: ImageWithMetadata[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }))
  }, [])

  const handleSubmit = async () => {
    try {
      // Adicionar o novo FAQ
      await addFaq({
        title: formData.title || "Novo FAQ",
        category: formData.category,
        description: formData.description || "Descrição do novo FAQ",
        author: formData.author,
        images: formData.images,
      })

      // Resetar o formulário
      setFormData({
        title: "",
        category: "",
        description: "",
        author: "",
        images: [],
      })

      // Fechar o diálogo
      document.querySelector('[data-state="open"]')?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))

      toast({
        title: "FAQ adicionado",
        description: "O FAQ foi adicionado com sucesso.",
      })
    } catch (error) {
      console.error("Error adding FAQ:", error)
      toast({
        title: "Erro ao adicionar FAQ",
        description: "Não foi possível adicionar o FAQ. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const removerFaq = async (id) => {
    setIsDeleting(id)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("faqs").delete().eq("id", id)

      if (error) {
        throw error
      }

      // O estado será atualizado automaticamente pelo realtime
      console.log("🗑️ FAQ removido com sucesso")
    } catch (error) {
      console.error("Error removing FAQ:", error)
      toast({
        title: "Erro ao remover FAQ",
        description: "Não foi possível remover o FAQ. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setFaqToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Consulte e gerencie a base de conhecimento do E-PROSYS</p>
            <RealtimeStatus isConnected={isConnected} isLoading={isLoading} tableName="FAQs" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar FAQs..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[85vh]">
              <DialogHeader>
                <DialogTitle>Adicionar FAQ</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo FAQ à base de conhecimento.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-1 my-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      placeholder="Digite o título do FAQ"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => {
                          const IconComponent = categoryIcons[category.id] || BookOpen
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-blue-600" />
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o problema e a solução"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <ImageUpload onImagesSelected={handleImagesSelected} initialImages={formData.images} />

                  <div className="grid gap-2">
                    <Label htmlFor="author">Autor</Label>
                    <Select value={formData.author} onValueChange={(value) => handleInputChange("author", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o autor" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingAuthors ? (
                          <SelectItem value="loading" disabled>
                            Carregando autores...
                          </SelectItem>
                        ) : autores.length > 0 ? (
                          autores.map((autor) => (
                            <SelectItem key={autor.id} value={autor.name}>
                              {autor.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            Nenhum autor cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2 border-t">
                <Button type="submit" onClick={handleSubmit} disabled={!formData.title || !formData.category}>
                  Salvar FAQ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveCategory}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.id] || BookOpen
            return (
              <TabsTrigger key={category.id} value={category.id}>
                <IconComponent className="mr-1 h-4 w-4" /> {category.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <h3 className="mt-4 text-lg font-semibold">Carregando FAQs...</h3>
            </div>
          ) : filteredFaqs?.length > 0 ? (
            filteredFaqs.map((faq) => {
              const category = categories.find((c) => c.id === faq.category) || {
                id: faq.category,
                name: faq.category,
              }
              const IconComponent = categoryIcons[category.id] || BookOpen

              return (
                <Card key={faq.id} className="relative group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      <CardTitle>{faq.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Categoria: {category?.name}
                      {faq.author && <span className="ml-2">• Autor: {faq.author}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm line-clamp-3">{faq.description}</p>
                    {faq.images && faq.images.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          {faq.images.length} {faq.images.length === 1 ? "imagem" : "imagens"} anexada
                          {faq.images.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      className="flex-1 mr-2"
                      onClick={() => {
                        setSelectedFaq(faq)
                        setShowDetails(true)
                      }}
                    >
                      Ver detalhes
                    </Button>

                    <AlertDialog open={faqToDelete === faq.id} onOpenChange={(open) => !open && setFaqToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => setFaqToDelete(faq.id)}
                          disabled={isDeleting === faq.id}
                        >
                          {isDeleting === faq.id ? (
                            <div className="w-4 h-4 border-2 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover FAQ</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover este FAQ? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removerFaq(faq.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              )
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum FAQ encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Não encontramos nenhum FAQ que corresponda à sua pesquisa.
              </p>
            </div>
          )}
        </div>
      </Tabs>

      {/* Diálogo de detalhes do FAQ */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{selectedFaq?.title}</DialogTitle>
            <DialogDescription>
              Categoria: {categories.find((c) => c.id === selectedFaq?.category)?.name}
              {selectedFaq?.author && <span className="ml-2">• Autor: {selectedFaq.author}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1 my-4">
            <div className="grid gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Descrição</h4>
                <p className="whitespace-pre-line">{selectedFaq?.description}</p>
              </div>

              {selectedFaq?.images && selectedFaq.images.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Imagens</h4>
                  <div className="space-y-4">
                    {selectedFaq.images.map((image, index) => (
                      <Card key={index} className="overflow-hidden group">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                            <div className="border rounded-md overflow-hidden h-[150px] relative">
                              <img
                                src={image.src || "/placeholder.svg"}
                                alt={image.title || `Imagem ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setZoomImage(image)
                                }}
                              >
                                <ZoomIn className="h-4 w-4" />
                                <span className="sr-only">Ampliar imagem</span>
                              </Button>
                            </div>

                            <div className="space-y-3">
                              {image.title && (
                                <div>
                                  <h5 className="text-sm font-medium">Título</h5>
                                  <p>{image.title}</p>
                                </div>
                              )}

                              {image.description && (
                                <div>
                                  <h5 className="text-sm font-medium">Descrição</h5>
                                  <p className="text-sm text-muted-foreground">{image.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium mb-2">Imagens</h4>
                  <p className="text-sm text-muted-foreground">Nenhuma imagem anexada a este FAQ.</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Autor</h4>
                <p>{selectedFaq?.author || "Não especificado"}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button onClick={() => setShowDetails(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
