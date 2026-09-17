"use client";

import React from "react";
import { User, ChevronDown } from "lucide-react";
import { HeaderInfo } from "../lib/api";

interface CustomerFormProps {
  headerData: HeaderInfo;
  namaSo: string;
  namaOh: string;
  noteOh: string;
  onChangeHeader: (field: keyof HeaderInfo, value: string) => void;
  onChangeSo: (value: string) => void;
  onChangeOh: (value: string) => void;
  onChangeNoteOh: (value: string) => void;
}

const BANK_OPTIONS = [
  { label: "Pilih Bank Terkait...", value: "" },
  { label: "Bank Central Asia (BCA)", value: "BCA" },
  { label: "Bank Rakyat Indonesia (BRI)", value: "BRI" },
  { label: "Bank Negara Indonesia (BNI)", value: "BNI" },
  { label: "Bank Mandiri", value: "MANDIRI" },
  { label: "Bank Permata", value: "PERMATA" },
  { label: "Bank Syariah Indonesia (BSI)", value: "BSI" },
];

export const CustomerForm: React.FC<CustomerFormProps> = ({
  headerData,
  namaSo,
  namaOh,
  noteOh,
  onChangeHeader,
  onChangeSo,
  onChangeOh,
  onChangeNoteOh,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#d9d9d9] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-6 mb-6">
      {/* Header Card dengan Badge Biru Ant Design */}
      <div className="flex items-start gap-3.5 pb-5 mb-5 border-b border-[#f0f0f0]">
        <div className="w-10 h-10 rounded-xl bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1f1f1f] tracking-tight">
            Tahap 1: Pengisian Identitas &amp; Validasi Awal
          </h2>
          <p className="text-xs text-[#8c8c8c] mt-0.5">
            Lengkapi seluruh kolom wajib (<span className="text-[#ff4d4f]">*</span>) untuk melanjutkan ke proses unggah berkas rekening koran
          </p>
        </div>
      </div>

      {/* SEKSI 1: INFORMASI REKENING & NASABAH */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-[#434343] tracking-wider uppercase mb-3.5">
          INFORMASI REKENING &amp; NASABAH
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
          {/* Cabang */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Cabang <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={headerData.cabang}
              onChange={(e) => onChangeHeader("cabang", e.target.value)}
              placeholder="Contoh: KC Jakarta Thamrin"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Nama Customer */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Nama Customer <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={headerData.nama_cust}
              onChange={(e) => onChangeHeader("nama_cust", e.target.value)}
              placeholder="Masukkan nama customer..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Nama Pemegang Rekening - Full Width Spanning Both Columns */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Nama Pemegang Rekening <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={headerData.nama_pemegang_rek}
              onChange={(e) => onChangeHeader("nama_pemegang_rek", e.target.value)}
              placeholder="Masukkan nama pemegang rekening..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Nomor Rekening */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Nomor Rekening <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={headerData.no_rekening}
              onChange={(e) => onChangeHeader("no_rekening", e.target.value)}
              placeholder="Masukkan nomor rekening..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Pilihan Bank */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Pilihan Bank <span className="text-[#ff4d4f]">*</span>
            </label>
            <div className="relative">
              <select
                value={headerData.nama_bank.toUpperCase()}
                onChange={(e) => onChangeHeader("nama_bank", e.target.value)}
                className="w-full appearance-none px-3.5 py-2 pr-9 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all cursor-pointer"
              >
                {BANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8c8c8c] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI 2: PENGESAHAN & CATATAN OPERASIONAL */}
      <div>
        <h3 className="text-xs font-bold text-[#434343] tracking-wider uppercase mb-3.5">
          PENGESAHAN &amp; CATATAN OPERASIONAL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
          {/* Petugas Pengaju (SO) */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Petugas Pengaju (SO) <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={namaSo}
              onChange={(e) => onChangeSo(e.target.value)}
              placeholder="Masukkan nama Sales Officer (SO)..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Operation Head (OH) */}
          <div>
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Operation Head (OH) <span className="text-[#ff4d4f]">*</span>
            </label>
            <input
              type="text"
              value={namaOh}
              onChange={(e) => onChangeOh(e.target.value)}
              placeholder="Masukkan nama Operation Head (OH)..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Catatan OH (Note OH) (opsional) - Full Width */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#262626] mb-1.5">
              Catatan OH (Note OH) <span className="text-[#8c8c8c] font-normal">(opsional)</span>
            </label>
            <textarea
              rows={3}
              value={noteOh}
              onChange={(e) => onChangeNoteOh(e.target.value)}
              placeholder="Catatan verifikasi atau analisis khusus dari Operation Head (dapat dikosongkan)..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#d9d9d9] bg-white text-[#1f1f1f] placeholder:text-[#bfbfbf] hover:border-[#4096ff] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/15 focus:outline-none transition-all resize-y"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
