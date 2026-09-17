from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import numpy as np


def build_uniform_resume(
    bank: str,
    bulan: str,
    opening_bal: Optional[float],
    freq_db: int,
    freq_cr: int,
    mutasi_db: float,
    mutasi_cr: float,
    saldo_max: float,
    saldo_avg: float,
    saldo_min: float,
    tx_records: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Menghasilkan dictionary resume dengan format yang seragam dan tervalidasi.
    """
    return {
        "bank": str(bank),
        "bulan": str(bulan),
        "opening_bal": float(opening_bal) if opening_bal is not None else 0.0,
        "freq_db": int(freq_db),
        "freq_cr": int(freq_cr),
        "mutasi_db": round(float(mutasi_db), 2),
        "mutasi_cr": round(float(mutasi_cr), 2),
        "saldo_max": round(float(saldo_max), 2),
        "saldo_avg": round(float(saldo_avg), 2),
        "saldo_min": round(float(saldo_min), 2),
        "tx_records": tx_records,
    }


def compute_balance_stats(balances: List[float], fallback_val: float = 0.0) -> tuple:
    """
    Menghitung saldo_max, saldo_avg, saldo_min dari kumpulan saldo valid.
    """
    valid_b = [b for b in balances if b is not None and b >= 1000]
    if valid_b:
        s_max = max(valid_b)
        s_min = min(valid_b)
        s_avg = float(np.mean(valid_b))
    else:
        s_max = fallback_val
        s_min = fallback_val
        s_avg = fallback_val
    return s_max, s_avg, s_min


class BaseBankParser(ABC):
    """
    Base class untuk semua parser rekening koran bank.
    """

    @abstractmethod
    def parse(self, pdf, all_text: str, pages_text: List[str], filename: str = "") -> Dict[str, Any]:
        """
        Mengekstrak data transaksi dan menghasilkan format dictionary seragam.
        """
        pass
