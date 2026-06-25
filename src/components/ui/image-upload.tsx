import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { NeumorphicCardInset } from "./card";
import { UploadCloud, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../context/ToastContext";

interface ImageUploadProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  className?: string;
}

export function ImageUploadDropzone({
  onImageSelected,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const { addToast } = useToast();

  const compressImage = (
    dataUrl: string,
    mimeType: string,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, 0.7));
      };
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          addToast("Image size should be less than 10MB.", "error");
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          let result = reader.result as string;
          try {
            result = await compressImage(result, file.type);
          } catch (e) {
            console.error("Failed to compress image", e);
          }
          setPreview(result);
          onImageSelected(result, file.type);
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelected, addToast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  if (preview) {
    return (
      <NeumorphicCardInset
        className={cn(
          "relative overflow-hidden w-full aspect-video flex items-center justify-center p-2",
          className,
        )}
      >
        <img
          src={preview}
          alt="Upload preview"
          className="object-cover w-full h-full rounded-xl"
        />
        <button
          onClick={() => setPreview(null)}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </NeumorphicCardInset>
    );
  }

  return (
    <NeumorphicCardInset
      {...getRootProps()}
      className={cn(
        "w-full aspect-video flex flex-col items-center justify-center p-6 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors",
        isDragActive && "border-blue-500 bg-blue-50/10",
        className,
      )}
    >
      <input {...getInputProps()} />
      <div className="p-4 bg-[#e9eef5] rounded-full shadow-[2px_2px_4px_#b8bec5,-2px_-2px_4px_#ffffff] mb-4">
        <UploadCloud className="h-8 w-8 text-blue-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 text-center">
        Drag & drop an image here, or click to select
      </p>
      <p className="text-xs text-slate-500 mt-2 text-center">
        JPEG, PNG, WebP up to 10MB
      </p>
    </NeumorphicCardInset>
  );
}
