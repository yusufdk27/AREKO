import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class MandiriParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        op_m = re.search(r"Opening\s+Balance\s*\n*[:\|\s]*([\d,]+\.\d{2})", all_text[:2500], re.IGNORECASE)
        opening_balance = float(op_m.group(1).replace(",", "")) if op_m else None

        tx_records = []
        balances = []
        active_date = ""

        for txt in pages_text:
            lines = txt.split("\n")
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue

                if any(k in line_str.upper() for k in [
                    "LAPORAN REKENING KORAN", "ACCOUNT STATEMENT REPORT",
                    "CLOSING BALANCE", "BRANCH", "ACCOUNT NO"
                ]):
                    continue

                tgl_match = re.search(r"\b(\d{2}/\d{2})/\d{4}\b", line_str)
                if tgl_match:
                    active_date = tgl_match.group(1)

                nums_m = re.findall(r"([\d,]+\.\d{2})", line_str)
                if len(nums_m) >= 3:
                    last_3 = [float(n.replace(",", "")) for n in nums_m[-3:]]
                    d_val, k_val, s_val = last_3[0], last_3[1], last_3[2]

                    if (d_val > 0 or k_val > 0) and s_val > 0 and "OPENING BALANCE" not in line_str.upper():
                        balances.append(s_val)
                        tx_records.append({
                            "date": active_date,
                            "debet": d_val,
                            "kredit": k_val,
                            "saldo": s_val
                        })

        if opening_balance is None and tx_records:
            opening_balance = round(tx_records[0]["saldo"] + tx_records[0]["debet"] - tx_records[0]["kredit"], 2)

        freq_db = sum(1 for r in tx_records if r["debet"] > 0)
        freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)
        mutasi_db = sum(r["debet"] for r in tx_records)
        mutasi_cr = sum(r["kredit"] for r in tx_records)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_balance or 0.0)

        return build_uniform_resume(
            bank="MANDIRI",
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
