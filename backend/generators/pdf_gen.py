import io
from typing import Dict, Any, List, Union, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, portrait
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from backend.detector import sort_resume_chronological




def generate_form_pdf(
    output_target: Optional[Union[str, io.BytesIO]] = None,
    header_info: Optional[Dict[str, str]] = None,
    resume_list: Optional[List[Dict[str, Any]]] = None,
    note_oh: str = "",
    nama_so: str = "",
    nama_oh: str = "",
) -> Union[str, io.BytesIO]:
    """
    Membuat file PDF form validasi mutasi rekening resmi dengan ReportLab.
    Mendukung output ke path string atau in-memory io.BytesIO.
    """
    header_info = header_info or {}
    resume_list = resume_list or []
    sorted_resume = sort_resume_chronological(resume_list)

    target = output_target or io.BytesIO()

    doc = SimpleDocTemplate(
        target,
        pagesize=portrait(A4),
        rightMargin=18,
        leftMargin=18,
        topMargin=25,
        bottomMargin=25,
    )
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        alignment=1,
        spaceAfter=15,
    )
    story.append(Paragraph("<b>FORM VALIDASI MUTASI REKENING</b>", title_style))

    # Header Data Nasabah (Kotak Hijau)
    header_rows = [
        ["Cabang", ":", header_info.get("cabang", "")],
        ["Nama Cust", ":", header_info.get("nama_cust", "")],
        ["", "", ""],
        ["Nomor Rekening", ":", header_info.get("no_rekening", "")],
        ["Nama Bank", ":", header_info.get("nama_bank", "")],
        ["Nama Pemegang Rekening", ":", header_info.get("nama_pemegang_rek", "")],
    ]

    t_header = Table(header_rows, colWidths=[140, 15, 404])
    t_header.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BACKGROUND", (2, 0), (2, 1), colors.HexColor("#E2EFDA")),
        ("BACKGROUND", (2, 3), (2, 5), colors.HexColor("#E2EFDA")),
        ("BOX", (2, 0), (2, 1), 0.5, colors.black),
        ("BOX", (2, 3), (2, 5), 0.5, colors.black),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 12))

    sec_title_style = ParagraphStyle(
        "SecTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        spaceAfter=4,
    )
    story.append(Paragraph("<b>Resume Mutasi Rekening</b>", sec_title_style))

    # Tabel Resume Mutasi
    table_data = [
        ["Bulan", "Frekuensi", "", "Mutasi", "", "Saldo", "", ""],
        ["", "Debet", "Kredit", "Debet", "Kredit", "Tertinggi", "Rata-Rata", "Terendah"],
    ]

    totals = {"f_db": 0, "f_cr": 0, "m_db": 0.0, "m_cr": 0.0, "s_max": 0.0, "s_avg": 0.0, "s_min": 0.0}
    n = len(sorted_resume)

    for item in sorted_resume:
        totals["f_db"] += item.get("freq_db", 0)
        totals["f_cr"] += item.get("freq_cr", 0)
        totals["m_db"] += item.get("mutasi_db", 0.0)
        totals["m_cr"] += item.get("mutasi_cr", 0.0)
        totals["s_max"] += item.get("saldo_max", 0.0)
        totals["s_avg"] += item.get("saldo_avg", 0.0)
        totals["s_min"] += item.get("saldo_min", 0.0)

        table_data.append([
            item.get("bulan", "-"),
            f"{item.get('freq_db', 0):,}",
            f"{item.get('freq_cr', 0):,}",
            f"{item.get('mutasi_db', 0.0):,.2f}",
            f"{item.get('mutasi_cr', 0.0):,.2f}",
            f"{item.get('saldo_max', 0.0):,.2f}",
            f"{item.get('saldo_avg', 0.0):,.2f}",
            f"{item.get('saldo_min', 0.0):,.2f}",
        ])

    table_data.append([
        "Rata-Rata",
        f"{int(totals['f_db'] / n):,}" if n else "0",
        f"{int(totals['f_cr'] / n):,}" if n else "0",
        f"{totals['m_db'] / n:,.2f}" if n else "0.00",
        f"{totals['m_cr'] / n:,.2f}" if n else "0.00",
        f"{totals['s_max'] / n:,.2f}" if n else "0.00",
        f"{totals['s_avg'] / n:,.2f}" if n else "0.00",
        f"{totals['s_min'] / n:,.2f}" if n else "0.00",
    ])

    col_widths = [56, 38, 38, 86, 86, 85, 85, 85]
    t_resume = Table(table_data, colWidths=col_widths)
    t_resume.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 1), colors.HexColor("#D9E1F2")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.2),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("SPAN", (0, 0), (0, 1)),
        ("SPAN", (1, 0), (2, 0)),
        ("SPAN", (3, 0), (4, 0)),
        ("SPAN", (5, 0), (7, 0)),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E2EFDA")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN", (3, 2), (-1, -1), "RIGHT"),
        ("RIGHTPADDING", (3, 2), (-1, -1), 3),
        ("LEFTPADDING", (3, 2), (-1, -1), 3),
    ]))
    story.append(t_resume)
    story.append(Spacer(1, 15))

    # Note OH
    story.append(Paragraph("<b>Note OH:</b>", sec_title_style))
    note_box = Table([[note_oh if note_oh else "-"]], colWidths=[559])
    note_box.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
        ("MINROWHEIGHT", (0, 0), (-1, -1), 35),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(note_box)
    story.append(Spacer(1, 30))

    # Tanda Tangan
    so_display = f"SO: {nama_so}" if nama_so else "SO:"
    oh_display = f"Operation Head: {nama_oh}" if nama_oh else "Operation Head:"
    sign_data = [
        ["Mengajukan,", "Menyetujui,"],
        ["", ""],
        ["", ""],
        ["", ""],
        [so_display, oh_display],
    ]
    t_sign = Table(sign_data, colWidths=[275, 284])
    t_sign.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t_sign)

    doc.build(story)

    if isinstance(target, io.BytesIO):
        target.seek(0)
    return target
