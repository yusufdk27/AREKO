"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, SlidersHorizontal, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { StatementResume, HeaderInfo } from "../lib/api";
import { formatCurrency } from "../lib/utils";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: StatementResume | null;
  headerInfo: HeaderInfo;
}

type FilterType = "all" | "debet" | "kredit";

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  statement,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset search and filter when new statement opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setFilterType("all");
    }
  }, [isOpen, statement?.bulan]);

  const records = statement?.tx_records || [];

  const debetCount = useMemo(
    () => records.filter((r) => r.debet > 0).length || statement?.freq_db || 0,
    [records, statement]
  );
  const kreditCount = useMemo(
    () => records.filter((r) => r.kredit > 0).length || statement?.freq_cr || 0,
    [records, statement]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type Filter
      if (filterType === "debet" && r.debet <= 0) return false;
      if (filterType === "kredit" && r.kredit <= 0) return false;

      // Text Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dateMatch = r.date.toLowerCase().includes(q);
        const descMatch = (r.desc || "").toLowerCase().includes(q);
        const debetMatch = String(r.debet).includes(q);
        const kreditMatch = String(r.kredit).includes(q);
        const saldoMatch = r.saldo !== null && String(r.saldo).includes(q);
        return dateMatch || descMatch || debetMatch || kreditMatch || saldoMatch;
      }
      return true;
    });
  }, [records, filterType, searchQuery]);

  if (!isOpen || !statement) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.16)] border border-[#d9d9d9] w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Header sesuai Gambar 2 Referensi */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-6 py-4 border-b border-[#f0f0f0] bg-white">
          {/* Sisi Kiri: Icon, Judul, Pill Badge Total, dan Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-[#1f1f1f]">
                  Rincian Transaksi: Bulan {statement.bulan || "-"}
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                  {records.length > 0 ? records.length : debetCount + kreditCount} Transaksi
                </span>
              </div>
              <p className="text-xs text-[#8c8c8c] mt-0.5">
                {debetCount} Transaksi Debet • {kreditCount} Transaksi Kredit
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Badge Debet, Badge Kredit, & Tombol Tutup Modal */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Red Badge Debet */}
            <div className="px-3 py-1 rounded-lg bg-[#fff1f0] border border-[#ffccc7] text-xs font-bold text-[#cf1322] shadow-2xs font-mono">
              Debet: Rp {formatCurrency(statement.mutasi_db, false)}
            </div>

            {/* Green Badge Kredit */}
            <div className="px-3 py-1 rounded-lg bg-[#f6ffed] border border-[#b7eb8f] text-xs font-bold text-[#389e0d] shadow-2xs font-mono">
              Kredit: Rp {formatCurrency(statement.mutasi_cr, false)}
            </div>

            {/* Blue Outlined Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e6f4ff] hover:bg-[#bae0ff] border border-[#91caff] text-xs font-semibold text-[#1677ff] transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Modal</span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR & FILTER TABS (Sesuai Gambar 2) */}
        <div className="px-6 py-3.5 border-b border-[#f0f0f0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input Field */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian transaksi, tanggal, atau nominal..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#8c8c8c] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-[#8c8c8c] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Buttons: Semua, Debet, Kredit */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Tab Semua */}
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                filterType === "all"
                  ? "bg-[#1677ff] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Semua ({records.length > 0 ? records.length : debetCount + kreditCount})
            </button>

            {/* Tab Debet */}
            <button
              type="button"
              onClick={() => setFilterType("debet")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                filterType === "debet"
                  ? "bg-[#ff4d4f] text-white"
                  : "bg-[#fff1f0] text-[#cf1322] border border-[#ffccc7] hover:bg-[#ffccc7]/60"
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Debet ({debetCount})</span>
            </button>

            {/* Tab Kredit */}
            <button
              type="button"
              onClick={() => setFilterType("kredit")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                filterType === "kredit"
                  ? "bg-[#52c41a] text-white"
                  : "bg-[#f6ffed] text-[#389e0d] border border-[#b7eb8f] hover:bg-[#b7eb8f]/60"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Kredit ({kreditCount})</span>
            </button>
          </div>
        </div>

        {/* TABEL MUTASI DETAIL (Persis Kolom & Gaya Gambar 2) */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#f5f7fa] sticky top-0 border-b border-[#e8e8e8] z-10 shadow-2xs">
              <tr className="text-[#262626] font-semibold">
                <th className="px-3.5 py-2.5 text-center w-12">No</th>
                <th className="px-3.5 py-2.5 text-left w-32">Tanggal &amp; Waktu</th>
                <th className="px-3.5 py-2.5 text-left">Uraian Transaksi</th>
                <th className="px-3.5 py-2.5 text-right w-44">Debet (Rp)</th>
                <th className="px-3.5 py-2.5 text-right w-44">Kredit (Rp)</th>
                <th className="px-3.5 py-2.5 text-right w-44">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] bg-white font-mono">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((tx, idx) => (
                  <tr
                    key={`tx-${statement.bulan}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* No */}
                    <td className="px-3.5 py-2 text-center text-slate-400 text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Tanggal & Waktu */}
                    <td className="px-3.5 py-2 text-left font-mono text-slate-700">
                      {tx.date || "-"}
                    </td>

                    {/* Uraian Transaksi */}
                    <td className="px-3.5 py-2 text-left font-sans text-xs text-slate-800 font-medium tracking-tight">
                      {tx.desc || "-"}
                    </td>

                    {/* Debet (Rp) */}
                    <td className="px-3.5 py-2 text-right text-[#cf1322] font-semibold">
                      {tx.debet > 0 ? formatCurrency(tx.debet, false) : (
                        <span className="text-[#cf1322] font-bold">-</span>
                      )}
                    </td>

                    {/* Kredit (Rp) */}
                    <td className="px-3.5 py-2 text-right text-[#389e0d] font-semibold">
                      {tx.kredit > 0 ? formatCurrency(tx.kredit, false) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Saldo (Rp) */}
                    <td className="px-3.5 py-2 text-right font-bold text-[#1f1f1f]">
                      {tx.saldo !== null ? formatCurrency(tx.saldo, false) : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#8c8c8c] font-sans">
                    <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs mt-1 text-slate-400">
                      {searchQuery
                        ? "Tidak ada transaksi yang cocok dengan kata kunci pencarian Anda"
                        : "Tidak ada transaksi dalam kategori filter ini"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER: Menampilkan baris transaksi & Tombol Tutup Hitam Pekat */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#f0f0f0] bg-white">
          <div className="text-xs text-slate-500 font-sans">
            Menampilkan <span className="font-semibold text-slate-800">{filteredRecords.length}</span> dari{" "}
            <span className="font-semibold text-slate-800">{records.length}</span> transaksi
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-xs transition-all cursor-pointer font-sans"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
