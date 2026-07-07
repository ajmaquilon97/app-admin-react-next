"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

const MAX_IMAGES = 7;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageSlot = { preview: string; url: string; uploading: boolean; error: string };

interface GalleryUploaderProps {
  value: string[];             // URLs públicas controladas por el padre
  onChange: (urls: string[]) => void;
}

async function uploadToS3(file: File): Promise<string> {
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "No se pudo obtener la URL de subida.");
  }

  const { uploadUrl, publicUrl } = (await res.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!s3Res.ok) throw new Error("Error al subir la imagen a S3.");
  return publicUrl;
}

export function GalleryUploader({ value, onChange }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa los slots desde las URLs del padre (p.ej. al volver al paso)
  const [slots, setSlots] = useState<ImageSlot[]>(
    value.map((url) => ({ preview: url, url, uploading: false, error: "" }))
  );

  // Sincroniza hacia el padre cada vez que los slots cambian (fuera del render)
  useEffect(() => {
    onChange(slots.filter((s) => s.url && !s.uploading).map((s) => s.url));
    // onChange es estable (setImagenesGaleria de useState), no necesita estar en deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_IMAGES - slots.length;
    const toProcess = Array.from(files).slice(0, remaining);
    if (toProcess.length === 0) return;

    // Valida cada archivo
    const valid: File[] = [];
    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE_BYTES) continue;
      valid.push(file);
    }
    if (valid.length === 0) return;

    // Agrega slots con preview local inmediato
    const newSlots: ImageSlot[] = await Promise.all(
      valid.map(
        (file) =>
          new Promise<ImageSlot>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) =>
              resolve({
                preview: e.target?.result as string,
                url: "",
                uploading: true,
                error: "",
              });
            reader.readAsDataURL(file);
          })
      )
    );

    const startIndex = slots.length;
    const merged = [...slots, ...newSlots];
    setSlots(merged);

    // Sube cada imagen en paralelo
    await Promise.all(
      valid.map(async (file, i) => {
        const idx = startIndex + i;
        try {
          const url = await uploadToS3(file);
          setSlots((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx]!, url, uploading: false };
            return next;
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error al subir.";
          setSlots((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx]!, uploading: false, error: msg };
            return next;
          });
        }
      })
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const canAdd = slots.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Grid de imágenes */}
      {slots.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 aspect-video"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.preview}
                alt={`Imagen ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay de carga */}
              {slot.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}

              {/* Overlay de error */}
              {slot.error && (
                <div className="absolute inset-0 bg-error/70 flex items-center justify-center p-1">
                  <p className="text-white text-[10px] text-center leading-tight">{slot.error}</p>
                </div>
              )}

              {/* Botón eliminar */}
              {!slot.uploading && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-error rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Slot "agregar más" */}
          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-secondary hover:bg-secondary/5 flex flex-col items-center justify-center text-text-muted hover:text-secondary transition-colors gap-1"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Agregar</span>
            </button>
          )}
        </div>
      )}

      {/* Estado vacío: zona drop principal */}
      {slots.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 py-8 flex flex-col items-center justify-center text-center hover:border-secondary hover:bg-secondary/5 transition-colors cursor-pointer group"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-main">Arrastra las imágenes aquí</p>
          <p className="text-xs text-text-muted mt-1">JPG, PNG o WEBP · Máx. 5 MB por imagen · Hasta {MAX_IMAGES} imágenes</p>
        </div>
      )}

      {/* Contador */}
      <p className="text-xs text-text-muted text-right">
        {slots.filter((s) => s.url).length} / {MAX_IMAGES} imágenes subidas
      </p>
    </div>
  );
}
