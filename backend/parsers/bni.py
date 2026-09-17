import re
from typing import Dict, Any, List
from backend.parsers.base import BaseBankParser, build_uniform_resume, compute_balance_stats
from backend.detector import detect_bank_and_month




class BNIParser(BaseBankParser):
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        _, bulan = detect_bank_and_month(all_text, filename)

        ledger_m = re.search(r"Ledger\s+Balance\s*:\s*([\d,]+\.\d{2})", all_text, re.IGNORECASE)
        opening_balance = float(ledger_m.group(1).replace(",", "")) if ledger_m else None

        raw_items = []
        if pdf and hasattr(pdf, "pages"):
            for page in pdf.pages:
                words = page.extract_words(x_tolerance=3, y_tolerance=3)
                if not words:
                    continue
                p_width = float(page.width)
                x_bal_min = p_width * 0.84

                lines_dict = {}
                for w in words:
                    y_mid = round(w["top"] / 4.0) * 4.0
                    lines_dict.setdefault(y_mid, []).append(w)

                for y in sorted(lines_dict.keys()):
                    lw = sorted(lines_dict[y], key=lambda x: x["x0"])
                    line_str = " ".join(w["text"] for w in lw).strip()

                    if any(k in line_str.upper() for k in [
                        "ACCOUNT STATEMENT", "POSTING DATE", "TOTAL DEBET", "TOTAL CREDIT", "PAGE :"
                    ]):
                        continue

                    tgl_m = re.search(r"\b(\d{2}/\d{2})/\d{4}\b", line_str)
                    tgl_str = tgl_m.group(1) if tgl_m else ""

                    bal_words = [w for w in lw if w["x0"] >= x_bal_min - 15 and re.match(r"^[\d,]+\.\d{2}$", w["text"])]
                    if not bal_words:
                        continue

                    sal_val = float(bal_words[-1]["text"].replace(",", ""))
                    if "LEDGER BALANCE" not in line_str.upper():
                        raw_items.append({
                            "date": tgl_str,
                            "saldo": sal_val,
                            "page": page.page_number,
                            "top": y
                        })

        # Forward fill tanggal jika baris transaksi multi-line
        cur_d = ""
        for it in raw_items:
            if it["date"]:
                cur_d = it["date"]
            else:
                it["date"] = cur_d

        tx_records = []
        balances = []
        prev_sal = opening_balance if opening_balance is not None else (raw_items[0]["saldo"] if raw_items else 0.0)

        for it in raw_items:
            cur_sal = it["saldo"]
            delta = round(cur_sal - prev_sal, 2)
            if delta == 0:
                continue

            deb = abs(delta) if delta < 0 else 0.0
            krd = delta if delta > 0 else 0.0

            balances.append(cur_sal)
            tx_records.append({
                "date": it["date"],
                "debet": deb,
                "kredit": krd,
                "saldo": cur_sal
            })
            prev_sal = cur_sal

        # Footer resmi BNI
        text_clean = all_text.replace("|", " ")
        bni_deb = re.search(r"Total\s+Deb[ei]t\s*:\s*(?:(\d{1,4})\s+([\d,]+\.\d{2})|([\d,]+\.\d{2})\s+(\d{1,4}))", text_clean)
        bni_crd = re.search(r"Total\s+Cr[ei]dit\s*:\s*(?:(\d{1,4})\s+([\d,]+\.\d{2})|([\d,]+\.\d{2})\s+(\d{1,4}))", text_clean)

        if bni_deb and bni_crd:
            if bni_deb.group(1):
                freq_db = int(bni_deb.group(1))
                mutasi_db = float(bni_deb.group(2).replace(",", ""))
            else:
                mutasi_db = float(bni_deb.group(3).replace(",", ""))
                freq_db = int(bni_deb.group(4))

            if bni_crd.group(1):
                freq_cr = int(bni_crd.group(1))
                mutasi_cr = float(bni_crd.group(2).replace(",", ""))
            else:
                mutasi_cr = float(bni_crd.group(3).replace(",", ""))
                freq_cr = int(bni_crd.group(4))
        else:
            freq_db = sum(1 for r in tx_records if r["debet"] > 0)
            freq_cr = sum(1 for r in tx_records if r["kredit"] > 0)
            mutasi_db = sum(r["debet"] for r in tx_records)
            mutasi_cr = sum(r["kredit"] for r in tx_records)

        s_max, s_avg, s_min = compute_balance_stats(balances, fallback_val=opening_balance or 0.0)

        return build_uniform_resume(
            bank="BNI",
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
