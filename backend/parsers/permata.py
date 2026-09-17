import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class PermataParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        op_m = re.search(r"Opening\s+Balance\s*[:\|]?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        tot_deb_m = re.search(r"Total\s+Debit\s*[:\|]?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        tot_krd_m = re.search(r"Total\s+Credit\s*[:\|]?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)

        opening_balance = float(op_m.group(1).replace(",", "")) if op_m else 0.0
        mutasi_db_official = float(tot_deb_m.group(1).replace(",", "")) if tot_deb_m else None
        mutasi_cr_official = float(tot_krd_m.group(1).replace(",", "")) if tot_krd_m else None

        raw_tx = []
        for txt in pages_text:
            lines = txt.split("\n")
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue

                if any(k in line_str.upper() for k in [
                    "TRANSACTION HISTORY", "TRANSACTION DATE", "VALUE DATE",
                    "OPENING BALANCE", "TOTAL DEBIT", "TOTAL CREDIT", "CLOSING BALANCE", "PAGE "
                ]):
                    continue

                tgl_m = re.match(r"^(\d{2})\s+([A-Za-z]{3})\s+\d{4}\b", line_str)
                if not tgl_m:
                    continue

                tgl_str = f"{tgl_m.group(1)}/{tgl_m.group(2).upper()}"

                amt_m = re.search(r"(-?\s*[\d,]+\.\d{2}-?)\s*$", line_str)
                if not amt_m:
                    continue

                amt_str = amt_m.group(1).strip()
                is_minus = ("-" in amt_str)
                cleaned_num = re.sub(r"[^\d\.]", "", amt_str.replace(",", ""))

                try:
                    num_val = float(cleaned_num)
                except ValueError:
                    continue

                deb = num_val if is_minus else 0.0
                krd = num_val if not is_minus else 0.0

                raw_tx.append({
                    "date": tgl_str,
                    "debet": deb,
                    "kredit": krd
                })

        # Permata mencetak dari tanggal 31 ke tanggal 01 (dibalik agar kronologis maju)
        raw_tx.reverse()

        tx_records = []
        balances = []
        running_s = opening_balance

        for r in raw_tx:
            running_s = round(running_s + r["kredit"] - r["debet"], 2)
            balances.append(running_s)
            tx_records.append({
                "date": r["date"],
                "debet": r["debet"],
                "kredit": r["kredit"],
                "saldo": running_s
            })

        freq_db = sum(1 for r in tx_records if r["debet"] > 0)
        freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)
        mutasi_db = mutasi_db_official if mutasi_db_official is not None else sum(r["debet"] for r in tx_records)
        mutasi_cr = mutasi_cr_official if mutasi_cr_official is not None else sum(r["kredit"] for r in tx_records)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_balance)

        return build_uniform_resume(
            bank="PERMATA",
            bulan=bulan,
            opening_bal=opening_balance,
            freq_db=freq_db,
            freq_cr=freq_cr,
            mutasi_db=mutasi_db,
            mutasi_cr=mutasi_cr,
            saldo_max=s_max,
            saldo_avg=s_avg,
            saldo_min=s_min,
            tx_records=tx_records
        )
