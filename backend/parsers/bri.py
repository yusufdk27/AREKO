import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class BRIParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        tx_records = []
        balances = []

        for txt in pages_text:
            for line in txt.split("\n"):
                parts = line.strip().split()
                if len(parts) >= 4 and re.match(r"^\d{2}/\d{2}/\d{2}$", parts[0]):
                    nums = [p.replace(",", "") for p in parts[-3:]]
                    if all(re.match(r"^\d+\.\d{2}$", n) for n in nums):
                        d_val, k_val, s_val = float(nums[0]), float(nums[1]), float(nums[2])
                        tx_records.append({
                            "date": parts[0][:5],
                            "debet": d_val,
                            "kredit": k_val,
                            "saldo": s_val
                        })
                        balances.append(s_val)

        # Footer resmi BRI
        tot_m = re.search(
            r"Total Transaksi Debet\s+Total Transaksi Kredit\s+Saldo Akhir\s*\n\s*([\d,\.]+)\s+([\d,\.]+)\s+([\d,\.]+)\s+([\d,\.]+)",
            all_text
        )
        if tot_m:
            mutasi_db = float(tot_m.group(2).replace(",", ""))
            mutasi_cr = float(tot_m.group(3).replace(",", ""))
        else:
            mutasi_db = sum(r["debet"] for r in tx_records)
            mutasi_cr = sum(r["kredit"] for r in tx_records)

        freq_db = sum(1 for r in tx_records if r["debet"] > 0)
        freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)

        opening_bal = None
        if tx_records:
            opening_bal = round(tx_records[0]["saldo"] + tx_records[0]["debet"] - tx_records[0]["kredit"], 2)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_bal or 0.0)

        return build_uniform_resume(
            bank="BRI",
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
