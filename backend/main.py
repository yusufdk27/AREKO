import io
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

import sys
from pathlib import Path

# Memastikan root workspace ada di sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import SUPPORTED_BANKS
from backend.detector import sort_resume_chronological
from backend.parsers import parse_statement, PARSER_REGISTRY
from backend.generators import generate_form_excel, generate_form_pdf



# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("areko.main")

app = FastAPI(
    title="AREKO - Bank Statement Parser & Generator API",
    description="API untuk ekstraksi mutasi rekening koran multi-bank (BCA, BNI, BRI, Mandiri, Permata, BSI, dll) dan pembuatan laporan validasi resmi Excel & PDF.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend (development & production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan koneksi dari frontend Next.js (misal http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExportPayload(BaseModel):
    header_info: Dict[str, str] = {}
    resume_list: List[Dict[str, Any]] = []
    note_oh: str = "-"
    nama_so: str = ""
    nama_oh: str = ""


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint untuk memverifikasi kesiapan server backend dan daftar parser bank aktif.
    """
    return {
        "status": "healthy",
        "supported_banks": SUPPORTED_BANKS,
        "available_parsers": list(PARSER_REGISTRY.keys()),
    }


@app.post("/api/process")
async def process_statements(
    files: List[UploadFile] = File(...),
    cabang: Optional[str] = Form(""),
    nama_cust: Optional[str] = Form(""),
    no_rekening: Optional[str] = Form(""),
    nama_bank: Optional[str] = Form(""),
    nama_pemegang_rek: Optional[str] = Form(""),
    nama_so: Optional[str] = Form(""),
    nama_oh: Optional[str] = Form(""),
    note_oh: Optional[str] = Form("-"),
    bank_hint: Optional[str] = Form(None),
    export_type: str = Query("json", description="Pilihan output: 'json', 'excel', atau 'pdf'"),
):
    """
    Endpoint utama pemrosesan rekening koran.
    Menerima 1 s/d 3 file PDF (atau lebih), mem-parsing transaksi per bulan,
    dan mengembalikan data JSON tervalidasi atau langsung mengunduh file Excel/PDF.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Mohon unggah minimal 1 file rekening koran PDF.")

    header_input = {
        "cabang": (cabang or "").strip(),
        "nama_cust": (nama_cust or "").strip(),
        "no_rekening": (no_rekening or "").strip(),
        "nama_bank": (nama_bank or "").strip(),
        "nama_pemegang_rek": (nama_pemegang_rek or "").strip(),
    }

    resume_list = []
    detected_banks_list = []

    for file in files:
        filename = file.filename or "unknown.pdf"
        logger.info(f"Menerima berkas upload: {filename}")

        try:
            content = await file.read()
            if len(content) == 0:
                logger.warning(f"File {filename} kosong.")
                continue

            data_extracted = parse_statement(
                file_source=content,
                filename=filename,
                bank_hint=bank_hint or (nama_bank.strip().upper() if nama_bank else None),
            )
            resume_list.append(data_extracted)
            if data_extracted.get("bank"):
                detected_banks_list.append(data_extracted["bank"])

        except Exception as e:
            logger.error(f"Error memproses file {filename}: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Gagal memproses file {filename}: {str(e)}")

    if not resume_list:
        raise HTTPException(status_code=400, detail="Tidak ada file PDF valid yang berhasil diproses.")

    # Jika nama_bank di header belum diisi pengguna, otomatis isi dari hasil deteksi
    if not header_input["nama_bank"] and detected_banks_list:
        header_input["nama_bank"] = detected_banks_list[0]

    # Urutkan resume secara kronologis
    sorted_resume = sort_resume_chronological(resume_list)

    # Export langsung ke Excel jika diminta via query param ?export_type=excel
    if export_type.lower() == "excel":
        excel_stream = generate_form_excel(
            output_target=None,
            header_info=header_input,
            resume_list=sorted_resume,
            note_oh=note_oh or "-",
            nama_so=nama_so or "",
            nama_oh=nama_oh or "",
        )
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="FORM_VALIDASI_MUTASI_REKENING.xlsx"'},
        )

    # Export langsung ke PDF jika diminta via query param ?export_type=pdf
    if export_type.lower() == "pdf":
        pdf_stream = generate_form_pdf(
            output_target=None,
            header_info=header_input,
            resume_list=sorted_resume,
            note_oh=note_oh or "-",
            nama_so=nama_so or "",
            nama_oh=nama_oh or "",
        )
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="FORM_VALIDASI_MUTASI_REKENING.pdf"'},
        )

    # Hitung rata-rata untuk preview JSON
    n = len(sorted_resume)
    summary = {
        "total_months": n,
        "avg_freq_db": round(sum(it.get("freq_db", 0) for it in sorted_resume) / n) if n else 0,
        "avg_freq_cr": round(sum(it.get("freq_cr", 0) for it in sorted_resume) / n) if n else 0,
        "avg_mutasi_db": round(sum(it.get("mutasi_db", 0.0) for it in sorted_resume) / n, 2) if n else 0.0,
        "avg_mutasi_cr": round(sum(it.get("mutasi_cr", 0.0) for it in sorted_resume) / n, 2) if n else 0.0,
        "avg_saldo_max": round(sum(it.get("saldo_max", 0.0) for it in sorted_resume) / n, 2) if n else 0.0,
        "avg_saldo_avg": round(sum(it.get("saldo_avg", 0.0) for it in sorted_resume) / n, 2) if n else 0.0,
        "avg_saldo_min": round(sum(it.get("saldo_min", 0.0) for it in sorted_resume) / n, 2) if n else 0.0,
    }

    return {
        "status": "success",
        "header_info": header_input,
        "nama_so": nama_so or "",
        "nama_oh": nama_oh or "",
        "note_oh": note_oh or "-",
        "resume_list": sorted_resume,
        "summary": summary,
    }


@app.post("/api/export/excel")
async def export_excel(payload: ExportPayload):
    """
    Menghasilkan dan mengunduh file Excel formulir validasi resmi dari data JSON yang telah dipreview/diedit.
    """
    try:
        excel_stream = generate_form_excel(
            output_target=None,
            header_info=payload.header_info,
            resume_list=payload.resume_list,
            note_oh=payload.note_oh,
            nama_so=payload.nama_so,
            nama_oh=payload.nama_oh,
        )
        return StreamingResponse(
            excel_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="FORM_VALIDASI_MUTASI_REKENING.xlsx"'},
        )
    except Exception as e:
        logger.error(f"Gagal generate Excel: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Gagal generate Excel: {str(e)}")


@app.post("/api/export/pdf")
async def export_pdf(payload: ExportPayload):
    """
    Menghasilkan dan mengunduh file PDF formulir validasi resmi dari data JSON yang telah dipreview/diedit.
    """
    try:
        pdf_stream = generate_form_pdf(
            output_target=None,
            header_info=payload.header_info,
            resume_list=payload.resume_list,
            note_oh=payload.note_oh,
            nama_so=payload.nama_so,
            nama_oh=payload.nama_oh,
        )
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="FORM_VALIDASI_MUTASI_REKENING.pdf"'},
        )
    except Exception as e:
        logger.error(f"Gagal generate PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Gagal generate PDF: {str(e)}")


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)


