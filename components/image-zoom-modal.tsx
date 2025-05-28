"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ImageZoomModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageTitle?: string
  imageDescription?: string
}

export function ImageZoomModal({ isOpen, onClose, imageSrc, imageTitle, imageDescription }: ImageZoomModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1)
      setRotation(0)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Controls */}
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
              <span className="sr-only">Aumentar zoom</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
              <span className="sr-only">Diminuir zoom</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
              <span className="sr-only">Rotacionar</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 text-white border-white/20 hover:bg-black/70"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>

          {/* Image container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <img
              src={imageSrc || "/placeholder.svg"}
              alt={imageTitle || "Imagem ampliada"}
              className="max-w-full max-h-full object-contain transition-all duration-200"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Image info */}
          {(imageTitle || imageDescription) && (
            <div className="bg-black/80 text-white p-4 w-full">
              {imageTitle && <h3 className="text-lg font-medium">{imageTitle}</h3>}
              {imageDescription && <p className="text-sm text-gray-300 mt-1">{imageDescription}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
