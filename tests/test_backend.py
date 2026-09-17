import io
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import SUPPORTED_BANKS, MONTH_NAMES_ID
from backend.detector import detect_bank_and_month, sort_resume_chronological
from backend.parsers import parse_statement, PARSER_REGISTRY, get_parser
from backend.generators import generate_form_excel, generate_form_pdf
from backend.main import app


def test_imports_and_registry():
    print("[*] Testing parser registry...")
    assert len(PARSER_REGISTRY) == 6, f"Expected 6 parsers, got {len(PARSER_REGISTRY)}"
    for bank in ["BCA", "BNI", "BRI", "MANDIRI", "PERMATA", "BSI"]:
        assert bank in PARSER_REGISTRY, f"Missing parser for {bank}"
        p = get_parser(bank)
        assert p is not None
    print("  -> Parser registry: PASSED")


def test_detector():
    print("[*] Testing detector...")
    # Test BCA detection
    bank, month = detect_bank_and_month("REKENING GIRO\nNO. REKENING 12345\nPERIODE : JANUARI 2024")
    assert bank == "BCA", f"Expected BCA, got {bank}"
    assert month == "Januari", f"Expected Januari, got {month}"

    # Test BNI detection
    bank, month = detect_bank_and_month("BNI DIRECT LEDGER BALANCE 10,000,000.00\nDate : 01 Feb 2024 - 28 Feb 2024")
    assert bank == "BNI", f"Expected BNI, got {bank}"
    assert month == "Februari", f"Expected Februari, got {month}"

    # Test Mandiri detection
    bank, month = detect_bank_and_month("BANK MANDIRI ACCOUNT STATEMENT REPORT\n01-03-2024 sd 31-03-2024")
    assert bank == "MANDIRI", f"Expected MANDIRI, got {bank}"
    assert month == "Maret", f"Expected Maret, got {month}"

    # Test Permata detection
    bank, month = detect_bank_and_month("PERMATA BANK TRANSACTION HISTORY\n01 APR 2024 - 30 APR 2024")
    assert bank == "PERMATA", f"Expected PERMATA, got {bank}"
    assert month == "April", f"Expected April, got {month}"

    # Test BSI detection
    bank, month = detect_bank_and_month("BANK SYARIAH INDONESIA ACCOUNT STATEMENT\n2024-05-01")
    assert bank == "BSI", f"Expected BSI, got {bank}"

    print("  -> Detector: PASSED")


def test_chronological_sort():
    print("[*] Testing chronological sort...")
    sample = [
        {"bulan": "Maret", "freq_db": 10},
        {"bulan": "Januari", "freq_db": 5},
        {"bulan": "Februari", "freq_db": 8},
    ]
    sorted_res = sort_resume_chronological(sample)
    months = [item["bulan"] for item in sorted_res]
    assert months == ["Januari", "Februari", "Maret"], f"Unexpected sort order: {months}"
    print("  -> Chronological sort: PASSED")


def test_generators():
    print("[*] Testing Excel & PDF generators with dummy resume data...")
    dummy_header = {
        "cabang": "Jakarta Thamrin",
        "nama_cust": "PT Maju Bersama",
        "no_rekening": "1234567890",
        "nama_bank": "BCA",
        "nama_pemegang_rek": "PT Maju Bersama",
    }
    dummy_resume = [
        {
            "bank": "BCA",
            "bulan": "Januari",
            "opening_bal": 10000000.0,
            "freq_db": 15,
            "freq_cr": 20,
            "mutasi_db": 50000000.0,
            "mutasi_cr": 65000000.0,
            "saldo_max": 25000000.0,
            "saldo_avg": 18000000.0,
            "saldo_min": 10000000.0,
            "tx_records": [
                {"date": "02/01", "debet": 0.0, "kredit": 15000000.0, "saldo": 25000000.0},
                {"date": "05/01", "debet": 5000000.0, "kredit": 0.0, "saldo": 20000000.0},
            ]
        },
        {
            "bank": "BCA",
            "bulan": "Februari",
            "opening_bal": 25000000.0,
            "freq_db": 12,
            "freq_cr": 18,
            "mutasi_db": 40000000.0,
            "mutasi_cr": 55000000.0,
            "saldo_max": 40000000.0,
            "saldo_avg": 30000000.0,
            "saldo_min": 22000000.0,
            "tx_records": [
                {"date": "01/02", "debet": 0.0, "kredit": 10000000.0, "saldo": 35000000.0},
            ]
        }
    ]

    # Test Excel generation
    excel_buf = generate_form_excel(
        output_target=None,
        header_info=dummy_header,
        resume_list=dummy_resume,
        note_oh="Validasi mutasi memenuhi syarat",
        nama_so="Budi Santoso"
    )
    assert isinstance(excel_buf, io.BytesIO), "Excel generator did not return BytesIO"
    excel_bytes = excel_buf.getvalue()
    assert len(excel_bytes) > 1000, f"Excel output too small: {len(excel_bytes)} bytes"
    print(f"  -> Excel generator: PASSED ({len(excel_bytes)} bytes generated)")

    # Test PDF generation
    pdf_buf = generate_form_pdf(
        output_target=None,
        header_info=dummy_header,
        resume_list=dummy_resume,
        note_oh="Validasi mutasi memenuhi syarat",
        nama_so="Budi Santoso"
    )
    assert isinstance(pdf_buf, io.BytesIO), "PDF generator did not return BytesIO"
    pdf_bytes = pdf_buf.getvalue()
    assert len(pdf_bytes) > 1000, f"PDF output too small: {len(pdf_bytes)} bytes"
    print(f"  -> PDF generator: PASSED ({len(pdf_bytes)} bytes generated)")


def test_fastapi_endpoints():
    print("[*] Testing FastAPI routes registration...")
    routes = [route.path for route in app.routes]
    assert "/api/health" in routes, "Missing /api/health route"
    assert "/api/process" in routes, "Missing /api/process route"
    assert "/api/export/excel" in routes, "Missing /api/export/excel route"
    assert "/api/export/pdf" in routes, "Missing /api/export/pdf route"
    print(f"  -> FastAPI routes: PASSED (Found: {routes})")


if __name__ == "__main__":
    test_imports_and_registry()
    test_detector()
    test_chronological_sort()
    test_generators()
    test_fastapi_endpoints()
    print("\n[✓] ALL TESTS PASSED SUCCESSFULLY!")
