"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, ImageIcon, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export interface ImageWithMetadata {
  src: string
  title: string
  description: string
}

interface ImageUploadProps {
  onImagesSelected: (images: ImageWithMetadata[]) => void
  maxImages?: number
  initialImages?: ImageWithMetadata[]
}

export function ImageUpload({ onImagesSelected, maxImages = 5, initialImages = [] }: ImageUploadProps) {
  const [previewImages, setPreviewImages] = useState<ImageWithMetadata[]>(initialImages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use useEffect to notify parent component when previewImages changes
  useEffect(() => {
    onImagesSelected(previewImages)
  }, [previewImages, onImagesSelected])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit the number of images
    const remainingSlots = maxImages - previewImages.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    // Process each file
    const newImages: ImageWithMetadata[] = []
    let processedCount = 0

    filesToProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage = {
            src: event.target.result as string,
            title: "",
            description: "",
          }
          newImages.push(newImage)

          processedCount++
          if (processedCount === filesToProcess.length) {
            setPreviewImages((prev) => [...prev, ...newImages])
          }
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const updateImageMetadata = (index: number, field: "title" | "description", value: string) => {
    setPreviewImages((prev) => {
      const newImages = [...prev]
      newImages[index] = {
        ...newImages[index],
        [field]: value,
      }
      return newImages
    })
  }

  // Modificar a função para garantir que o componente funcione bem em um contexto rolável
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="images">Imagens (máx. {maxImages})</Label>
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={previewImages.length >= maxImages}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={previewImages.length >= maxImages}
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {previewImages.length > 0 && (
        <div className="space-y-4 mt-4">
          {previewImages.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                  <div className="relative border rounded-md overflow-hidden group h-[150px]">
                    <img
                      src={image.src || "/placeholder.svg"}
                      alt={image.title || `Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`image-title-${index}`} className="text-sm font-medium">
                        Título da imagem
                      </Label>
                      <Input
                        id={`image-title-${index}`}
                        placeholder="Adicione um título para esta imagem"
                        value={image.title}
                        onChange={(e) => updateImageMetadata(index, "title", e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`image-description-${index}`} className="text-sm font-medium">
                        Descrição da imagem
                      </Label>
                      <Textarea
                        id={`image-description-${index}`}
                        placeholder="Adicione uma descrição para esta imagem"
                        value={image.description}
                        onChange={(e) => updateImageMetadata(index, "description", e.target.value)}
                        className="mt-1 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {previewImages.length === 0 && (
        <div className="border border-dashed rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 mb-2" />
            <p>Nenhuma imagem selecionada</p>
            <p className="text-sm">Clique em "Adicionar" para selecionar imagens</p>
          </div>
        </div>
      )}
    </div>
  )
}
