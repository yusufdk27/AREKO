import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class BCAParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        awal_m = re.search(r"SALDO AWAL\s*:\s*([\d,\.]+)", all_text)
        opening_bal = float(awal_m.group(1).replace(",", "")) if awal_m else None

        tx_records = []
        for txt in pages_text:
            for line in txt.split("\n"):
                line_clean = line.strip()

                if any(x in line_clean.upper() for x in [
                    "NO. REKENING", "HALAMAN", "PERIODE", "MATA UANG", "CATATAN",
                    "BERSAMBUNG", "SALDO AWAL", "SALDO AKHIR", "MUTASI CR",
                    "MUTASI DB", "JL NUSANTARA", "DEPOK", "INDONESIA"
                ]):
                    continue

                # Kasus 1: Transaksi Debet (DB/DR)
                m_db = re.search(r"([\d,]+\.\d{2})\s+(?:DB|DR)(?:\s+([\d,]+\.\d{2}))?", line_clean)
                if m_db:
                    nom_db = float(m_db.group(1).replace(",", ""))
                    s_val = float(m_db.group(2).replace(",", "")) if m_db.group(2) else None
                    tgl_m = re.match(r"^(\d{2}/\d{2})", line_clean)
                    tgl_str = tgl_m.group(1) if tgl_m else ""

                    desc_part = line_clean[len(tgl_str):].strip()
                    desc_part = re.sub(r"([\d,]+\.\d{2}\s+(?:DB|DR)(?:\s+[\d,]+\.\d{2})?)$", "", desc_part).strip()

                    tx_records.append({
                        "date": tgl_str,
                        "desc": desc_part or "TRANSAKSI DEBET",
                        "debet": nom_db,
                        "kredit": 0.0,
                        "saldo": s_val
                    })
                    continue

                # Kasus 2: Transaksi Kredit atau baris mutasi biasa
                amounts = re.findall(r"\b([\d,]+\.\d{2})\b", line_clean)
                if amounts:
                    nums = [float(a.replace(",", "")) for a in amounts if float(a.replace(",", "")) < 50_000_000_000]
                    tgl_m = re.match(r"^(\d{2}/\d{2})", line_clean)
                    tgl_str = tgl_m.group(1) if tgl_m else ""

                    desc_part = line_clean[len(tgl_str):].strip()
                    desc_part = re.sub(r"(\b[\d,]+\.\d{2}\b(?:\s+\b[\d,]+\.\d{2}\b)?)$", "", desc_part).strip()

                    if len(nums) >= 2:
                        nom_cr, s_val = nums[-2], nums[-1]
                        tx_records.append({
                            "date": tgl_str,
                            "desc": desc_part or "TRANSAKSI KREDIT",
                            "debet": 0.0,
                            "kredit": nom_cr,
                            "saldo": s_val
                        })
                    elif len(nums) == 1 and tgl_str:
                        tx_records.append({
                            "date": tgl_str,
                            "desc": desc_part or "TRANSAKSI KREDIT",
                            "debet": 0.0,
                            "kredit": nums[0],
                            "saldo": None
                        })

        # Rekonstruksi running balance maju
        cur_s = opening_bal
        for r in tx_records:
            if r["saldo"] is not None:
                cur_s = r["saldo"]
            elif cur_s is not None:
                cur_s = cur_s + r["kredit"] - r["debet"]
                r["saldo"] = cur_s

        # Rekonstruksi running balance mundur bila ada baris awal yang kosong saldonya
        for i in range(len(tx_records) - 2, -1, -1):
            if tx_records[i]["saldo"] is None and tx_records[i + 1]["saldo"] is not None:
                tx_records[i]["saldo"] = tx_records[i + 1]["saldo"] - tx_records[i + 1]["kredit"] + tx_records[i + 1]["debet"]

        balances = [r["saldo"] for r in tx_records if r["saldo"] is not None]

        # Ringkasan footer resmi BCA
        cr_m = re.search(r"MUTASI CR\s*:\s*([\d,\.]+)", all_text)
        db_m = re.search(r"MUTASI DB\s*:\s*([\d,\.]+)", all_text)
        f_counts = re.findall(r"\n\s*(\d{1,4})\s*\n\s*(\d{1,4})\s*$", all_text.strip())

        if f_counts:
            freq_cr = int(f_counts[-1][0])
            freq_db = int(f_counts[-1][1])
        else:
            freq_db = sum(1 for r in tx_records if r["debet"] > 0)
            freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)

        mutasi_cr = float(cr_m.group(1).replace(",", "")) if cr_m else sum(r["kredit"] for r in tx_records)
        mutasi_db = float(db_m.group(1).replace(",", "")) if db_m else sum(r["debet"] for r in tx_records)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_bal or 0.0)

        return build_uniform_resume(
            bank="BCA",
            bulan=bulan,
            opening_bal=opening_bal,
            freq_db=freq_db,
            freq_cr=freq_cr,
            mutasi_db=mutasi_db,
            mutasi_cr=mutasi_cr,
            saldo_max=s_max,
            saldo_avg=s_avg,
            saldo_min=s_min,
            tx_records=tx_records
        )
