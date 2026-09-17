"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { formatFileSize } from "../lib/utils";

interface FileDropzoneProps {
  files: File[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (index: number) => void;
}

const MAX_FILES = 3;

export const FileDropzone: React.FC<FileDropzoneProps> = ({ files, onAddFiles, onRemoveFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = files.length >= MAX_FILES;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLimitReached) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processIncomingFiles = (incomingList: File[]) => {
    setLimitWarning(null);

    const pdfFiles = incomingList.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setLimitWarning("Hanya berkas format PDF rekening koran yang diperbolehkan.");
      return;
    }

    const remainingSlots = MAX_FILES - files.length;

    if (remainingSlots <= 0) {
      setLimitWarning(`Maksimal ${MAX_FILES} file PDF telah tercapai. Hapus salah satu berkas jika ingin menggantinya.`);
      return;
    }

    if (pdfFiles.length > remainingSlots) {
      const accepted = pdfFiles.slice(0, remainingSlots);
      onAddFiles(accepted);
      setLimitWarning(
        `Hanya ${remainingSlots} berkas yang ditambahkan. Sistem membatasi maksimal ${MAX_FILES} file rekening koran.`
      );
    } else {
      onAddFiles(pdfFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-6 mb-6">
      {/* Header Dropzone Ant Design */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1f1f1f] tracking-tight">
              Tahap 2: Unggah Berkas Rekening Koran (PDF)
            </h2>
            <p className="text-xs text-[#8c8c8c] mt-0.5">
              Unggah 1 s/d maksimal 3 file PDF bulan berbeda (BCA, BRI, BNI, Mandiri, Permata, BSI)
            </p>
          </div>
        </div>

        {/* Badge Kuota Upload File */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              files.length === MAX_FILES
                ? "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]"
                : files.length > 0
                ? "bg-[#e6f4ff] text-[#0958d9] border-[#91caff]"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {files.length} / {MAX_FILES} File Terunggah
          </span>
        </div>
      </div>

      {/* Warning Banner if limit exceeded */}
      {limitWarning && (
        <div className="mb-4 p-3 rounded-lg bg-[#fffbe6] border border-[#ffe58f] text-[#d48806] text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#faad14]" />
            <span>{limitWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => setLimitWarning(null)}
            className="text-xs text-[#8c8c8c] hover:text-[#1f1f1f] font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Ant Design Upload.Dragger Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isLimitReached) {
            inputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isLimitReached
            ? "border-[#d9d9d9] bg-[#fafafa] cursor-not-allowed opacity-90"
            : isDragging
            ? "border-[#1677ff] bg-[#e6f4ff]/50 scale-[1.005] cursor-pointer"
            : "border-[#d9d9d9] hover:border-[#4096ff] hover:bg-[#fafafa] bg-[#fafafa]/40 cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          disabled={isLimitReached}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
              isLimitReached
                ? "bg-slate-100 text-slate-400"
                : isDragging
                ? "bg-[#1677ff] text-white shadow-md shadow-[#1677ff]/30"
                : "bg-[#e6f4ff] text-[#1677ff]"
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          {isLimitReached ? (
            <>
              <p className="text-sm font-semibold text-[#1f1f1f]">
                Batas Maksimum 3 Berkas Telah Tercapai
              </p>
              <p className="text-xs text-[#8c8c8c] mt-1 max-w-md">
                Anda sudah memilih kuota maksimal 3 berkas rekening koran. Hapus salah satu berkas di bawah jika ingin mengganti.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#1f1f1f]">
                {isDragging
                  ? "Lepaskan file PDF di sini"
                  : "Klik untuk memilih file atau seret & lepas berkas ke area ini"}
              </p>
              <p className="text-xs text-[#8c8c8c] mt-1">
                Format PDF rekening koran resmi perbankan (maksimal 3 file, hingga 50 MB per file)
              </p>
            </>
          )}
        </div>
      </div>

      {/* File List Badges (Ant Design Tags Style) */}
      {files.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#434343] uppercase tracking-wider">
              Berkas Terlampir ({files.length} dari maks. {MAX_FILES}):
            </p>
            {files.length < MAX_FILES && (
              <span className="text-[11px] text-[#1677ff]">
                + Sisa kuota: {MAX_FILES - files.length} berkas lagi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#d9d9d9] bg-white hover:border-[#91caff] hover:shadow-xs transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1f1f1f] truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-[#8c8c8c]">{formatFileSize(file.size)}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#389e0d] bg-[#f6ffed] border border-[#b7eb8f] px-1.5 py-0.2 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Siap
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(idx);
                  }}
                  className="p-1.5 text-[#8c8c8c] hover:text-[#ff4d4f] hover:bg-[#fff1f0] rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Hapus berkas ini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#d48806] bg-[#fffbe6] p-3 rounded-lg border border-[#ffe58f]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#faad14]" />
          <span>Belum ada berkas yang dipilih. Silakan unggah minimal 1 file PDF (maksimal 3 file) untuk melanjutkan validasi.</span>
        </div>
      )}
    </div>
  );
};
