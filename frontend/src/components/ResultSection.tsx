"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  FileDown,
  Building,
  User,
  CreditCard,
  Table as TableIcon,
  Loader2,
  Eye,
  Check,
} from "lucide-react";
import { ProcessResponse, ExportPayload, StatementResume } from "../lib/api";
import { formatCurrency, formatNumber } from "../lib/utils";
import { TransactionModal } from "./TransactionModal";

interface ResultSectionProps {
  result: ProcessResponse;
  onDownloadExcel: (payload: ExportPayload) => Promise<void>;
  onDownloadPdf: (payload: ExportPayload) => Promise<void>;
  isDownloadingExcel: boolean;
  isDownloadingPdf: boolean;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  result,
  onDownloadExcel,
  onDownloadPdf,
  isDownloadingExcel,
  isDownloadingPdf,
}) => {
  const [selectedMonthForModal, setSelectedMonthForModal] = useState<StatementResume | null>(null);

  const { header_info, resume_list, summary, nama_so, nama_oh, note_oh } = result;

  const exportPayload: ExportPayload = {
    header_info,
    resume_list,
    note_oh,
    nama_so,
    nama_oh: nama_oh || "",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-6 mb-8 transition-all animate-in fade-in duration-300">
      {/* Top Banner: Ant Design Alert Style & Action Download Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] flex items-center justify-center shadow-xs">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Hasil Validasi Mutasi Berhasil</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                {resume_list.length} Bulan Terdeteksi
              </span>
            </div>
            <p className="text-xs text-[#8c8c8c] mt-0.5">
              Data transaksi telah diekstraksi dan diverifikasi sesuai format formulir perbankan resmi.
            </p>
          </div>
        </div>

        {/* Action Buttons: Download Excel & Download PDF */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onDownloadExcel(exportPayload)}
            disabled={isDownloadingExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#52c41a] hover:bg-[#73d13d] active:bg-[#389e0d] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isDownloadingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Unduh Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => onDownloadPdf(exportPayload)}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] active:bg-[#0958d9] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>Unduh PDF Resmi (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Header Recap Info Box */}
      <div className="mt-5 p-4 rounded-xl bg-[#fafafa] border border-[#d9d9d9] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div>
          <span className="text-[#8c8c8c] block font-medium">Bank</span>
          <span className="font-semibold text-[#1f1f1f] flex items-center gap-1 mt-0.5">
            <Building className="w-3.5 h-3.5 text-[#1677ff]" />
            {header_info.nama_bank || "-"}
          </span>
        </div>
        <div>
          <span className="text-[#8c8c8c] block font-medium">Cabang</span>
          <span className="font-semibold text-[#1f1f1f] truncate block mt-0.5">
            {header_info.cabang || "-"}
          </span>
        </div>
        <div>
          <span className="text-[#8c8c8c] block font-medium">Nama Customer</span>
          <span className="font-semibold text-[#1f1f1f] flex items-center gap-1 truncate mt-0.5">
            <User className="w-3.5 h-3.5 text-[#8c8c8c]" />
            {header_info.nama_cust || "-"}
          </span>
        </div>
        <div>
          <span className="text-[#8c8c8c] block font-medium">Nomor Rekening</span>
          <span className="font-semibold text-[#1f1f1f] flex items-center gap-1 mt-0.5">
            <CreditCard className="w-3.5 h-3.5 text-[#8c8c8c]" />
            {header_info.no_rekening || "-"}
          </span>
        </div>
        <div>
          <span className="text-[#8c8c8c] block font-medium">Pengaju (SO)</span>
          <span className="font-semibold text-[#1f1f1f] truncate block mt-0.5">
            {nama_so || "-"}
          </span>
        </div>
        <div>
          <span className="text-[#8c8c8c] block font-medium">Operation Head (OH)</span>
          <span className="font-semibold text-[#1f1f1f] truncate block mt-0.5">
            {nama_oh || "-"}
          </span>
        </div>
      </div>

      {/* 1. TABEL RESUME MUTASI REKENING (OFFICIAL FORMAT SESUAI GAMBAR 1) */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-[#1677ff]" />
            <h3 className="text-sm font-bold text-[#1f1f1f]">
              Tabel Resume Mutasi Rekening
            </h3>
          </div>
          <span className="text-xs text-[#8c8c8c]">
            Klik tombol <span className="font-semibold text-[#1677ff]">Lihat Detail</span> untuk menampilkan rincian mutasi transaksi
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#c5d3ea] shadow-xs">
          <table className="w-full text-xs border-collapse">
            <thead>
              {/* Row 1 Header */}
              <tr className="bg-[#D9E1F2] text-slate-900 font-bold divide-x divide-[#c5d3ea]">
                <th rowSpan={2} className="px-3.5 py-2.5 text-center align-middle border-b border-[#c5d3ea]">
                  Bulan
                </th>
                <th colSpan={2} className="px-3 py-1.5 text-center border-b border-[#c5d3ea]">
                  Frekuensi
                </th>
                <th colSpan={2} className="px-3 py-1.5 text-center border-b border-[#c5d3ea]">
                  Mutasi
                </th>
                <th colSpan={3} className="px-3 py-1.5 text-center border-b border-[#c5d3ea]">
                  Saldo
                </th>
                <th rowSpan={2} className="px-3.5 py-2.5 text-center align-middle border-b border-[#c5d3ea] w-32">
                  Aksi
                </th>
              </tr>
              {/* Row 2 Header */}
              <tr className="bg-[#D9E1F2] text-slate-900 font-bold divide-x divide-[#c5d3ea] border-b border-[#c5d3ea]">
                <th className="px-3 py-2 text-center">Debet</th>
                <th className="px-3 py-2 text-center">Kredit</th>
                <th className="px-3 py-2 text-right">Debet (Rp)</th>
                <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                <th className="px-3 py-2 text-right">Tertinggi (Rp)</th>
                <th className="px-3 py-2 text-right">Rata-Rata (Rp)</th>
                <th className="px-3 py-2 text-right">Terendah (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5d3ea] bg-white font-mono">
              {resume_list.map((item, idx) => (
                <tr key={`${item.bulan}-${idx}`} className="hover:bg-slate-50/80 divide-x divide-[#e2e8f0] transition-colors">
                  <td className="px-3.5 py-3 text-center font-bold text-slate-800 font-sans">
                    {item.bulan || `Bulan ${idx + 1}`}
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-slate-600">
                    {formatNumber(item.freq_db)}
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-slate-600">
                    {formatNumber(item.freq_cr)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-800">
                    {formatCurrency(item.mutasi_db, false)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-800">
                    {formatCurrency(item.mutasi_cr, false)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-800 font-medium">
                    {formatCurrency(item.saldo_max, false)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-800 font-medium">
                    {formatCurrency(item.saldo_avg, false)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-800 font-medium">
                    {formatCurrency(item.saldo_min, false)}
                  </td>
                  {/* Action Column: Button "Lihat Detail" */}
                  <td className="px-3 py-3 text-center font-sans">
                    <button
                      type="button"
                      onClick={() => setSelectedMonthForModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1677ff] hover:text-white bg-[#eef6ff] hover:bg-[#1677ff] border border-[#91caff] transition-all cursor-pointer shadow-2xs"
                      title={`Buka pop-up detail mutasi ${item.bulan}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Detail</span>
                    </button>
                  </td>
                </tr>
              ))}

              {/* Baris Rata-Rata Dinamis (Kotak Hijau Persis Gambar 1) */}
              <tr className="bg-[#E2EFDA] text-slate-900 font-bold divide-x divide-[#c5d3ea] border-t border-[#c5d3ea]">
                <td className="px-3.5 py-3 text-center font-bold text-slate-900 font-sans">
                  Rata-Rata
                </td>
                <td className="px-3 py-3 text-center font-bold text-slate-900">
                  {formatNumber(summary.avg_freq_db)}
                </td>
                <td className="px-3 py-3 text-center font-bold text-slate-900">
                  {formatNumber(summary.avg_freq_cr)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(summary.avg_mutasi_db, false)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(summary.avg_mutasi_cr, false)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(summary.avg_saldo_max, false)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(summary.avg_saldo_avg, false)}
                </td>
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  {formatCurrency(summary.avg_saldo_min, false)}
                </td>
                <td className="px-3 py-3 text-center text-slate-600 font-semibold text-xs font-sans">
                  Rata-Rata {resume_list.length} Bulan
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop-up Modal Detail Transaksi Ant Design */}
      <TransactionModal
        isOpen={!!selectedMonthForModal}
        onClose={() => setSelectedMonthForModal(null)}
        statement={selectedMonthForModal}
        headerInfo={header_info}
      />
    </div>
  );
};
