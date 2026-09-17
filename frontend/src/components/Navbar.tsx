"use client";

import React from "react";
import { Building2, ShieldCheck, Activity } from "lucide-react";

interface NavbarProps {
  isBackendHealthy: boolean | null;
  supportedBanks?: string[];
}

export const Navbar: React.FC<NavbarProps> = ({ isBackendHealthy, supportedBanks = [] }) => {
  return (
    <header className="border-b border-[#f0f0f0] bg-white sticky top-0 z-40 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1677ff] flex items-center justify-center text-white shadow-sm shadow-[#1677ff]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#1f1f1f]">AREKO</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                  AntD UI
                </span>
              </div>
              <p className="text-xs text-[#8c8c8c]">Bank Statement Parser &amp; Official Validator</p>
            </div>
          </div>

          {/* Right Info: Supported banks badge & Server Status */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#595959] bg-[#fafafa] px-3 py-1.5 rounded-lg border border-[#d9d9d9]">
              <ShieldCheck className="w-4 h-4 text-[#1677ff]" />
              <span>Multi-Bank Engine:</span>
              <div className="flex items-center gap-1 font-semibold text-[#1f1f1f]">
                {supportedBanks.length > 0 ? (
                  supportedBanks.filter(b => b !== "UMUM" && b !== "NOBU").slice(0, 6).join(", ")
                ) : (
                  "BCA, BNI, BRI, Mandiri, Permata, BSI"
                )}
              </div>
            </div>

            {/* Backend Connection Status (Ant Design Tag Badge) */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                isBackendHealthy === true
                  ? "bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]"
                  : isBackendHealthy === false
                  ? "bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]"
                  : "bg-[#fffbe6] text-[#d48806] border-[#ffe58f]"
              }`}
              title={
                isBackendHealthy === true
                  ? "Backend FastAPI aktif dan terhubung (Port 8000)"
                  : "Backend FastAPI belum terdeteksi aktif di port 8000"
              }
            >
              <span className="relative flex h-2 w-2">
                {isBackendHealthy === true && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52c41a] opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isBackendHealthy === true
                      ? "bg-[#52c41a]"
                      : isBackendHealthy === false
                      ? "bg-[#ff4d4f]"
                      : "bg-[#faad14]"
                  }`}
                ></span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Activity className="w-3 h-3" />
                {isBackendHealthy === true
                  ? "Server Siap"
                  : isBackendHealthy === false
                  ? "Backend Terputus"
                  : "Memeriksa..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
