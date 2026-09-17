/**
 * Klien HTTP untuk backend AREKO (FastAPI).
 *
 * Alamat backend dibaca dari NEXT_PUBLIC_API_URL agar deployment produksi dapat
 * menunjuk ke layanan FastAPI yang terpisah. Bila tidak diset, fallback ke
 * server pengembangan lokal di http://localhost:8000.
 */
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export interface HeaderInfo {
  cabang: string;
  nama_cust: string;
  no_rekening: string;
  nama_bank: string;
  nama_pemegang_rek: string;
}

export interface TransactionRecord {
  date: string;
  desc?: string;
  debet: number;
  kredit: number;
  saldo: number | null;
}

export interface StatementResume {
  bank: string;
  bulan: string;
  opening_bal: number;
  freq_db: number;
  freq_cr: number;
  mutasi_db: number;
  mutasi_cr: number;
  saldo_max: number;
  saldo_avg: number;
  saldo_min: number;
  tx_records: TransactionRecord[];
}

export interface ResumeSummary {
  total_months: number;
  avg_freq_db: number;
  avg_freq_cr: number;
  avg_mutasi_db: number;
  avg_mutasi_cr: number;
  avg_saldo_max: number;
  avg_saldo_avg: number;
  avg_saldo_min: number;
}

export interface ProcessResponse {
  status: string;
  header_info: HeaderInfo;
  nama_so: string;
  nama_oh: string;
  note_oh: string;
  resume_list: StatementResume[];
  summary: ResumeSummary;
}

export interface ExportPayload {
  header_info: HeaderInfo;
  resume_list: StatementResume[];
  note_oh: string;
  nama_so: string;
  nama_oh: string;
}

export interface HealthStatus {
  healthy: boolean;
  banks?: string[];
}

/** Mengambil pesan error yang dapat dibaca dari respons FastAPI. */
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown })?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  } catch {
    // Respons bukan JSON (misal halaman error proxy) — pakai pesan fallback.
  }
  return `${fallback} (HTTP ${response.status})`;
}

/** Memicu unduhan berkas di browser dari sebuah Blob. */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Memeriksa kesiapan backend beserta daftar bank yang didukung.
 * Tidak pernah melempar error — kegagalan koneksi dilaporkan sebagai unhealthy.
 */
export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { cache: "no-store" });
    if (!response.ok) return { healthy: false };

    const data = (await response.json()) as {
      status?: string;
      supported_banks?: string[];
    };
    return {
      healthy: data.status === "healthy",
      banks: data.supported_banks,
    };
  } catch {
    return { healthy: false };
  }
}

/** Mengunggah berkas rekening koran dan mengambil hasil resume dalam bentuk JSON. */
export async function processStatements(formData: FormData): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/process?export_type=json`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Gagal memproses berkas rekening koran"));
  }

  return (await response.json()) as ProcessResponse;
}

/** Membuat dan mengunduh formulir validasi dalam format Excel (.xlsx). */
export async function downloadExcel(payload: ExportPayload, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/export/excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Gagal mengunduh Excel"));
  }

  triggerBlobDownload(await response.blob(), filename);
}

/** Membuat dan mengunduh formulir validasi dalam format PDF (.pdf). */
export async function downloadPdf(payload: ExportPayload, filename: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Gagal mengunduh PDF"));
  }

  triggerBlobDownload(await response.blob(), filename);
}
