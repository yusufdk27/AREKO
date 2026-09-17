import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class BSIParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        op_m = re.search(r"Opening\s+Balance[\s\S]{0,30}?(?:IDR)?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        opening_balance = float(op_m.group(1).replace(",", "")) if op_m else 0.0

        tot_deb_m = re.search(r"Total\s+Debit\s+Amount\s*[:\|]?\s*(?:IDR)?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        tot_krd_m = re.search(r"Total\s+Credit\s+Amount\s*[:\|]?\s*(?:IDR)?\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        mutasi_db_off = float(tot_deb_m.group(1).replace(",", "")) if tot_deb_m else None
        mutasi_cr_off = float(tot_krd_m.group(1).replace(",", "")) if tot_krd_m else None

        tx_records = []
        balances = []
        active_date = ""

        # Metode 1: Ekstraksi baris teks
        if pdf and hasattr(pdf, "pages"):
            for page in pdf.pages:
                txt = page.extract_text() or ""
                lines = txt.split("\n")
                for line in lines:
                    line_str = line.strip()
                    if not line_str:
                        continue

                    if any(k in line_str.upper() for k in [
                        "ACCOUNT STATEMENT", "OPENING BALANCE", "TOTAL DEBIT",
                        "TOTAL CREDIT", "CLOSING BALANCE", "PAGE "
                    ]):
                        continue

                    tgl_m = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", line_str)
                    if tgl_m:
                        active_date = f"{tgl_m.group(3)}/{tgl_m.group(2)}"

                    nums = re.findall(r"([\d,]+\.\d{2})", line_str)
                    if len(nums) >= 2:
                        val_bal = float(nums[-1].replace(",", ""))
                        val_amt = float(nums[-2].replace(",", ""))

                        is_db = ("DB" in line_str.upper() and "CR" not in line_str.upper()) or (" DB " in line_str.upper())
                        deb = val_amt if is_db else 0.0
                        krd = 0.0 if is_db else val_amt

                        if val_bal > 0 and (deb > 0 or krd > 0):
                            balances.append(val_bal)
                            tx_records.append({
                                "date": active_date,
                                "debet": deb,
                                "kredit": krd,
                                "saldo": val_bal
                            })

        # Metode 2: Fallback dengan extract_tables jika ekstraksi baris teks tidak mendeteksi transaksi
        if not tx_records and pdf and hasattr(pdf, "pages"):
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or len(row) < 5:
                            continue
                        row_cells = [str(c).replace("\n", " ").strip() for c in row if c is not None and str(c).strip()]
                        row_str = " | ".join(row_cells)

                        if any(k in row_str.upper() for k in [
                            "ACCOUNT STATEMENT", "OPENING BALANCE", "TOTAL DEBIT", "FT NUMBER"
                        ]):
                            continue

                        tgl_m = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", row_str)
                        if tgl_m:
                            active_date = f"{tgl_m.group(3)}/{tgl_m.group(2)}"

                        nums = re.findall(r"([\d,]+\.\d{2})", row_str)
                        if len(nums) >= 2:
                            val_amt = float(nums[-2].replace(",", ""))
                            val_bal = float(nums[-1].replace(",", ""))

                            is_db = ("DB" in row_str.upper() and "CR" not in row_str.upper()) or (" DB " in row_str.upper())
                            deb = val_amt if is_db else 0.0
                            krd = 0.0 if is_db else val_amt

                            balances.append(val_bal)
                            tx_records.append({
                                "date": active_date,
                                "debet": deb,
                                "kredit": krd,
                                "saldo": val_bal
                            })

        freq_db = sum(1 for r in tx_records if r["debet"] > 0)
        freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)
        mutasi_db = mutasi_db_off if mutasi_db_off is not None else sum(r["debet"] for r in tx_records)
        mutasi_cr = mutasi_cr_off if mutasi_cr_off is not None else sum(r["kredit"] for r in tx_records)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_balance)

        return build_uniform_resume(
            bank="BSI",
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
