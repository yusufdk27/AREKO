/** Helper format angka & berkas dengan konvensi Indonesia (id-ID). */

const CURRENCY_FORMATTER = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INTEGER_FORMATTER = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/**
 * Memformat nominal rupiah, misal 1234567.5 menjadi "1.234.567,50".
 * Setel withSymbol ke true untuk menambahkan awalan "Rp ".
 */
export function formatCurrency(
  value: number | null | undefined,
  withSymbol: boolean = true
): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const formatted = CURRENCY_FORMATTER.format(amount);
  return withSymbol ? `Rp ${formatted}` : formatted;
}

/** Memformat bilangan bulat seperti frekuensi transaksi, misal 1234 menjadi "1.234". */
export function formatNumber(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return INTEGER_FORMATTER.format(amount);
}

/** Mengubah ukuran berkas dalam byte menjadi teks ringkas, misal "2,4 MB". */
export function formatFileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, exponent);
  const decimals = exponent === 0 ? 0 : 1;

  return `${size.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${units[exponent]}`;
}
