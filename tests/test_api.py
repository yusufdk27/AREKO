import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "BCA" in data["available_parsers"]
    print("Health check response:", data)

def test_api_export_excel():
    payload = {
        "header_info": {"cabang": "Jakarta", "nama_cust": "Nasabah Test", "nama_bank": "BCA"},
        "resume_list": [{"bulan": "Januari", "freq_db": 5, "freq_cr": 5, "mutasi_db": 1000.0, "mutasi_cr": 2000.0, "saldo_max": 2000.0, "saldo_avg": 1500.0, "saldo_min": 1000.0, "tx_records": []}],
        "note_oh": "OK",
        "nama_so": "Tester"
    }
    response = client.post("/api/export/excel", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 1000
    print("Excel export API test: PASSED")

def test_api_export_pdf():
    payload = {
        "header_info": {"cabang": "Jakarta", "nama_cust": "Nasabah Test", "nama_bank": "BCA"},
        "resume_list": [{"bulan": "Januari", "freq_db": 5, "freq_cr": 5, "mutasi_db": 1000.0, "mutasi_cr": 2000.0, "saldo_max": 2000.0, "saldo_avg": 1500.0, "saldo_min": 1000.0, "tx_records": []}],
        "note_oh": "OK",
        "nama_so": "Tester"
    }
    response = client.post("/api/export/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
    print("PDF export API test: PASSED")

if __name__ == "__main__":
    test_api_health()
    test_api_export_excel()
    test_api_export_pdf()
    print("\n[✓] ALL API ENDPOINT TESTS PASSED!")
