import re
from typing import Tuple, List, Dict, Any
from backend.config import MONTH_NAMES_ID, MONTH_MAP




def detect_bank_and_month(full_text: str, filename: str = "") -> Tuple[str, str]:
    """
    Mendeteksi nama bank dan periode bulan dari isi teks PDF dan/atau nama file.
    """
    txt_upper = (full_text + " " + filename).upper()

    # Prioritas deteksi bank
    if any(k in txt_upper for k in ["BANK SYARIAH INDONESIA", "BSI", "7002347525"]):
        bank = "BSI"
    elif any(k in txt_upper for k in ["BANK RAKYAT INDONESIA", "IBIZ", "SETULUS HATI", "LAPORAN TRANSAKSI FINANSIAL"]):
        bank = "BRI"
    elif any(k in txt_upper for k in ["BANK MANDIRI", "MANDIRI", "ACCOUNT STATEMENT REPORT"]):
        bank = "MANDIRI"
    elif any(k in txt_upper for k in ["PERMATA", "PERMATA BANK", "PERMATABANK"]):
        bank = "PERMATA"
    elif any(k in txt_upper for k in [
        "BANK NEGARA INDONESIA", "BNI DIRECT", "ACCOUNT STATEMENT",
        "LEDGER BALANCE", "TRANSACTION DESCRIPTION", "EFFECTIVE DATE"
    ]) or "BNI" in filename.upper():
        bank = "BNI"
    elif any(k in txt_upper for k in ["BANK CENTRAL ASIA", "REKENING GIRO\nNO. REKENING"]) or "BCA" in filename.upper():
        bank = "BCA"
    elif "NOBU" in txt_upper:
        bank = "NOBU"
    else:
        bank = "UMUM"

    detected_month = "Bulan"

    # 1. Cek baris periode/tanggal resmi dokumen
    period_line = ""
    for line in full_text.split("\n"):
        line_up = line.upper()
        if any(k in line_up for k in ["DATE", "PERIOD", "PERIODE", "TANGGAL"]):
            period_line = line_up
            break

    # 2. Cek format BCA (misal: "PERIODE : JANUARI")
    for m in MONTH_NAMES_ID:
        m_up = m.upper()
        if (
            f"PERIODE\n: {m_up}" in txt_upper
            or f"PERIODE : {m_up}" in txt_upper
            or f"PERIODE {m_up}" in txt_upper
        ):
            detected_month = m
            return bank, detected_month

    # 3. Deteksi rentang tanggal DD Mon YYYY atau DD/MM/YYYY
    range_txt = re.search(
        r"(\d{2})[-/ ]([A-Za-z]{3}|\d{2})[-/ ]\d{2,4}\s*(?:sd|-)\s*\d{2}[-/ ]([A-Za-z]{3}|\d{2})[-/ ]\d{2,4}",
        full_text
    )
    if range_txt:
        m_raw = range_txt.group(2).upper()
        if m_raw in MONTH_MAP:
            detected_month = MONTH_MAP[m_raw]
        elif m_raw.isdigit() and 1 <= int(m_raw) <= 12:
            detected_month = MONTH_NAMES_ID[int(m_raw) - 1]

    # 4. Deteksi format rentang MM/YYYY (misal: /01/2024 - 31/01/2024)
    if detected_month == "Bulan":
        range_m = re.search(r"/(\d{2})/\d{2,4}\s*-\s*\d{2}/(\d{2})/\d{2,4}", full_text)
        if range_m:
            m_idx = int(range_m.group(2))
            if 1 <= m_idx <= 12:
                detected_month = MONTH_NAMES_ID[m_idx - 1]

    # 5. Cek pada baris periode khusus
    if detected_month == "Bulan" and period_line:
        for m_code, m_name in MONTH_MAP.items():
            if re.search(rf"\b{m_code}\b", period_line):
                detected_month = m_name
                break

    # 6. Cek singkatan bulan dari nama file atau seluruh teks
    if detected_month == "Bulan":
        # Utamakan cek nama file dulu agar akurat jika file dinamai per bulan
        for m_code, m_name in MONTH_MAP.items():
            if re.search(rf"\b{m_code}\b", filename.upper()):
                detected_month = m_name
                break

    if detected_month == "Bulan":
        for m_code, m_name in MONTH_MAP.items():
            if re.search(rf"\b{m_code}\b", txt_upper):
                detected_month = m_name
                break

    # 7. Cek nama bulan lengkap
    if detected_month == "Bulan":
        for m_id in MONTH_NAMES_ID:
            if m_id.upper() in txt_upper:
                detected_month = m_id
                break

    # 8. Cek format tanggal standar DD-MM-YYYY
    if detected_month == "Bulan":
        num_m = re.search(r"\b\d{2}[-/](\d{2})[-/]\d{2,4}\b", full_text)
        if num_m:
            m_idx = int(num_m.group(1))
            if 1 <= m_idx <= 12:
                detected_month = MONTH_NAMES_ID[m_idx - 1]

    return bank, detected_month


def sort_resume_chronological(resume_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Mengurutkan daftar resume rekening koran per bulan secara kronologis (Januari - Desember).
    """
    filtered_list = [item for item in resume_list if item.get("bulan") and item.get("bulan") != "Bulan"]
    unresolved_list = [item for item in resume_list if not item.get("bulan") or item.get("bulan") == "Bulan"]

    def get_month_index(item):
        b = item.get("bulan", "")
        if b in MONTH_NAMES_ID:
            return MONTH_NAMES_ID.index(b)
        return 99

    sorted_main = sorted(filtered_list, key=get_month_index)
    return sorted_main + unresolved_list
