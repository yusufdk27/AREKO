"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "../components/Navbar";
import { CustomerForm } from "../components/CustomerForm";
import { FileDropzone } from "../components/FileDropzone";
import { ResultSection } from "../components/ResultSection";
import {
  HeaderInfo,
  ProcessResponse,
  ExportPayload,
  checkBackendHealth,
  processStatements,
  downloadExcel,
  downloadPdf,
} from "../lib/api";
import { Play, RotateCcw, AlertTriangle, Sparkles, CheckCircle2, Info, FileText, UploadCloud, CheckCircle } from "lucide-react";

export default function HomePage() {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [supportedBanks, setSupportedBanks] = useState<string[]>([]);

  // Customer Form States
  const [headerData, setHeaderData] = useState<HeaderInfo>({
    cabang: "",
    nama_cust: "",
    no_rekening: "",
    nama_bank: "",
    nama_pemegang_rek: "",
  });
  const [namaSo, setNamaSo] = useState<string>("");
  const [namaOh, setNamaOh] = useState<string>("");
  const [noteOh, setNoteOh] = useState<string>("-");

  // Files State (Max 3 files)
  const [files, setFiles] = useState<File[]>([]);

  // Processing & Loading States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);

  // Download States
  const [isDownloadingExcel, setIsDownloadingExcel] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Check Backend Health on Mount
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then(({ healthy, banks }) => {
      if (isMounted) {
        setIsBackendHealthy(healthy);
        if (banks) setSupportedBanks(banks);
      }
    });

    const interval = setInterval(() => {
      checkBackendHealth().then(({ healthy }) => {
        if (isMounted) setIsBackendHealthy(healthy);
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleHeaderChange = (field: keyof HeaderInfo, value: string) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setErrorMessage(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setHeaderData({
      cabang: "",
      nama_cust: "",
      no_rekening: "",
      nama_bank: "",
      nama_pemegang_rek: "",
    });
    setNamaSo("");
    setNamaOh("");
    setNoteOh("-");
    setFiles([]);
    setResult(null);
    setErrorMessage(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setErrorMessage("Silakan unggah minimal 1 file PDF rekening koran terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("cabang", headerData.cabang);
    formData.append("nama_cust", headerData.nama_cust);
    formData.append("no_rekening", headerData.no_rekening);
    formData.append("nama_bank", headerData.nama_bank);
    formData.append("nama_pemegang_rek", headerData.nama_pemegang_rek);
    formData.append("nama_so", namaSo);
    formData.append("nama_oh", namaOh);
    formData.append("note_oh", noteOh || "-");

    try {
      const data = await processStatements(formData);
      setResult(data);

      // Otomatis update bank di form jika terdeteksi dan sebelumnya kosong
      if (!headerData.nama_bank && data.header_info.nama_bank) {
        setHeaderData((prev) => ({ ...prev, nama_bank: data.header_info.nama_bank }));
      }

      // Scroll halus ke hasil
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExcel = async (payload: ExportPayload) => {
    setIsDownloadingExcel(true);
    try {
      const filename = `FORM_VALIDASI_MUTASI_${(payload.header_info.nama_cust || "NASABAH").replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      await downloadExcel(payload, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh Excel.";
      alert(msg);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async (payload: ExportPayload) => {
    setIsDownloadingPdf(true);
    try {
      const filename = `FORM_VALIDASI_MUTASI_${(payload.header_info.nama_cust || "NASABAH").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      await downloadPdf(payload, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunduh PDF.";
      alert(msg);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Hitung status step untuk Ant Design Steps Indicator
  const isStep1Done = !!(headerData.cabang || headerData.nama_cust || headerData.no_rekening);
  const isStep2Done = files.length > 0;
  const isStep3Done = !!result;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">
      <Navbar isBackendHealthy={isBackendHealthy} supportedBanks={supportedBanks} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Ant Design Page Header Banner */}
        <div className="mb-6 bg-white p-6 rounded-2xl border border-[#d9d9d9] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ekstraktor Cerdas Rekening Koran &amp; Generator Validasi</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1f1f1f] tracking-tight">
                Bank Statement Parser &amp; Official Validator
              </h1>
              <p className="text-xs text-[#8c8c8c] mt-1 max-w-2xl">
                Parser otomatis mutasi multi-bank (BCA, BNI, BRI, Mandiri, Permata, BSI). Hasil validasi siap diunduh dalam lembar kerja Excel (.xlsx) dan PDF (.pdf) resmi.
              </p>
            </div>

            {/* Ant Design Steps Indicator */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isStep1Done ? "bg-[#1677ff] text-white" : "bg-slate-100 text-[#8c8c8c] border border-[#d9d9d9]"
                }`}>
                  1
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1f1f1f]">Identitas</p>
                  <p className="text-[10px] text-[#8c8c8c]">Formulir data</p>
                </div>
              </div>

              <div className="w-8 h-[1px] bg-[#d9d9d9]" />

              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isStep2Done ? "bg-[#1677ff] text-white" : "bg-slate-100 text-[#8c8c8c] border border-[#d9d9d9]"
                }`}>
                  2
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1f1f1f]">Unggah PDF</p>
                  <p className="text-[10px] text-[#8c8c8c]">Maks. 3 berkas</p>
                </div>
              </div>

              <div className="w-8 h-[1px] bg-[#d9d9d9]" />

              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isStep3Done ? "bg-[#52c41a] text-white" : "bg-slate-100 text-[#8c8c8c] border border-[#d9d9d9]"
                }`}>
                  3
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1f1f1f]">Hasil Resume</p>
                  <p className="text-[10px] text-[#8c8c8c]">Excel &amp; PDF</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server Disconnected Alert (Ant Design Alert Style) */}
        {isBackendHealthy === false && (
          <div className="mb-6 p-4 rounded-xl bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#ff4d4f] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Backend FastAPI belum terhubung di http://localhost:8000</p>
              <p className="text-[#cf1322] mt-1">
                Jalankan perintah backend berikut pada terminal:
                <code className="mx-1 px-1.5 py-0.5 bg-[#ffccc7] rounded text-[#820014] font-mono">
                  backend/venv/bin/uvicorn backend.main:app --reload --port 8000
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Error Notification (Ant Design Alert Style) */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#fff2f0] border border-[#ffccc7] text-[#cf1322] text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ff4d4f] shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-[#ff4d4f] hover:text-[#cf1322] underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 1. Form Header Data Nasabah (Ant Design Replicated Layout) */}
        <CustomerForm
          headerData={headerData}
          namaSo={namaSo}
          namaOh={namaOh}
          noteOh={noteOh}
          onChangeHeader={handleHeaderChange}
          onChangeSo={setNamaSo}
          onChangeOh={setNamaOh}
          onChangeNoteOh={setNoteOh}
        />

        {/* 2. Drag and Drop Upload PDF (Max 3 Files Enforced) */}
        <FileDropzone
          files={files}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
        />

        {/* 3. Action Control Bar (Ant Design Button Hierarchy) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#d9d9d9] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] mb-8">
          <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
            <Info className="w-4 h-4 text-[#1677ff] shrink-0" />
            <span>
              {files.length > 0
                ? `${files.length} dari maks. 3 berkas PDF siap divalidasi ke sistem.`
                : "Unggah minimal 1 berkas rekening koran untuk memulai proses validasi."}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Ant Design Default Button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[#d9d9d9] bg-white text-[#262626] hover:border-[#4096ff] hover:text-[#1677ff] active:border-[#0958d9] active:text-[#0958d9] text-xs font-medium transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            {/* Ant Design Primary Button */}
            <button
              type="button"
              onClick={handleProcess}
              disabled={files.length === 0 || isProcessing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] active:bg-[#0958d9] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sedang Memproses Rekening...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Proses &amp; Validasi</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Result & Download Section */}
        <div ref={resultRef}>
          {result && (
            <ResultSection
              result={result}
              onDownloadExcel={handleDownloadExcel}
              onDownloadPdf={handleDownloadPdf}
              isDownloadingExcel={isDownloadingExcel}
              isDownloadingPdf={isDownloadingPdf}
            />
          )}
        </div>
      </main>

      {/* Modern Minimal Ant Design Footer */}
      <footer className="border-t border-[#f0f0f0] bg-white py-5 text-center text-xs text-[#8c8c8c] mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} AREKO — Bank Statement Parser &amp; Official Validator.</p>
          <div className="flex items-center gap-3 text-[11px] text-[#bfbfbf]">
            <span>FastAPI Engine</span>
            <span>•</span>
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Ant Design System Guidelines</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
