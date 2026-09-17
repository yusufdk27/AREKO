import io
import logging
from typing import Dict, Any, Optional, Union
import pdfplumber

from backend.parsers.base import BaseBankParser, build_uniform_resume
from backend.parsers.bca import BCAParser
from backend.parsers.bni import BNIParser
from backend.parsers.bri import BRIParser
from backend.parsers.mandiri import MandiriParser
from backend.parsers.permata import PermataParser
from backend.parsers.bsi import BSIParser
from backend.detector import detect_bank_and_month



logger = logging.getLogger("areko.parsers")

PARSER_REGISTRY = {
    "BCA": BCAParser,
    "BNI": BNIParser,
    "BRI": BRIParser,
    "MANDIRI": MandiriParser,
    "PERMATA": PermataParser,
    "BSI": BSIParser,
}


def get_parser(bank_name: str) -> BaseBankParser:
    """
    Mengambil instance parser berdasarkan nama bank.
    Fallback ke BCAParser jika bank tidak dikenali (pola transaksi debet/kredit umum).
    """
    bank_clean = (bank_name or "").strip().upper()
    parser_cls = PARSER_REGISTRY.get(bank_clean, BCAParser)
    return parser_cls()


def parse_statement(
    file_source: Union[str, bytes, io.BytesIO],
    filename: str = "",
    bank_hint: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fungsi utama untuk mem-parsing file rekening koran PDF (bisa berupa path file, bytes, atau BytesIO).
    Mengekstrak teks, mendeteksi bank & bulan, lalu menjalankan parser yang sesuai.
    """
    if isinstance(file_source, bytes):
        pdf_file = io.BytesIO(file_source)
    else:
        pdf_file = file_source

    all_text = ""
    pages_text = []

    try:
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                txt = page.extract_text() or ""
                pages_text.append(txt)
                all_text += "\n" + txt

            # Deteksi bank dan bulan
            detected_bank, detected_month = detect_bank_and_month(all_text, filename)
            active_bank = bank_hint.upper() if (bank_hint and bank_hint.upper() in PARSER_REGISTRY) else detected_bank

            logger.info(f"Parsing '{filename}': Bank={active_bank} (detected={detected_bank}), Bulan={detected_month}")

            parser = get_parser(active_bank)
            result = parser.parse(pdf, all_text, pages_text, filename=filename)

            # Pastikan nama bank dan bulan terisi sesuai deteksi/override
            if active_bank and active_bank != "UMUM":
                result["bank"] = active_bank
            if detected_month and detected_month != "Bulan" and result.get("bulan") in ["Bulan", "", None]:
                result["bulan"] = detected_month

            return result

    except Exception as e:
        logger.error(f"Gagal mem-parsing rekening koran {filename}: {str(e)}", exc_info=True)
        return build_uniform_resume(
            bank=bank_hint or "UMUM",
            bulan="Bulan",
            opening_bal=0.0,
            freq_db=0,
            freq_cr=0,
            mutasi_db=0.0,
            mutasi_cr=0.0,
            saldo_max=0.0,
            saldo_avg=0.0,
            saldo_min=0.0,
            tx_records=[]
        )
