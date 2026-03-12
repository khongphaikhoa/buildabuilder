"use client";

import { useCallback, useState } from "react";
import type { UploadFile } from "@/lib/questionnaire/schema";
import type { QuestionSection } from "@/lib/questionnaire/schema";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TEXT_TYPES = ["text/plain", "text/markdown", "application/markdown"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface FileUploadProps {
  section: QuestionSection;
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
}

export function FileUpload({ section, files, onChange }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);

      const toAdd: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} exceeds 5 MB limit`);
          continue;
        }
        const isImage = IMAGE_TYPES.includes(file.type);
        const isText = TEXT_TYPES.includes(file.type) || file.name.endsWith(".md") || file.name.endsWith(".txt");
        if (!isImage && !isText) {
          setError(`${file.name}: only images (jpg, png, webp) and text (txt, md) are supported`);
          continue;
        }
        toAdd.push(file);
      }

      if (files.length + toAdd.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files per section`);
        return;
      }

      const newUploads: UploadFile[] = await Promise.all(
        toAdd.map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          base64: await fileToBase64(file),
          section,
        }))
      );
      onChange([...files, ...newUploads]);
    },
    [files, section, onChange]
  );

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const isImage = (type: string) => IMAGE_TYPES.includes(type);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
          dragActive ? "border-stone-400 bg-stone-100" : "border-stone-300 bg-stone-50"
        }`}
      >
        <input
          type="file"
          id={`file-${section}`}
          multiple
          accept=".jpg,.jpeg,.png,.webp,.txt,.md"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <label htmlFor={`file-${section}`} className="cursor-pointer">
          <p className="text-sm font-medium text-stone-600">
            Drag and drop or click to upload
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Images (jpg, png, webp) or notes (txt, md). Max 5 MB per file, 10 files.
          </p>
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3"
            >
              {isImage(file.type) ? (
                <img
                  src={file.base64.startsWith("data:") ? file.base64 : `data:${file.type};base64,${file.base64}`}
                  alt={file.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-stone-200 text-stone-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
