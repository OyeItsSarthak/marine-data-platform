"""
The Safe Box - Data Harmonization & Auto-Cleaning Engine
Standardizes scientific dates, geographic coordinates, and taxonomic species names.
"""
import io
import re
import json
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional

# Reference dictionary for species standardization and common-to-scientific name matching
TAXONOMIC_REFERENCE = {
    "yellowfin tuna": "Thunnus albacares",
    "yellowfin": "Thunnus albacares",
    "tuna": "Thunnus albacares",
    "thunnus albacares": "Thunnus albacares",
    "indian mackerel": "Rastrelliger kanagurta",
    "mackerel": "Rastrelliger kanagurta",
    "rastrelliger kanagurta": "Rastrelliger kanagurta",
    "oil sardine": "Sardinella longiceps",
    "sardine": "Sardinella longiceps",
    "sardinella longiceps": "Sardinella longiceps",
    "whale shark": "Rhincodon typus",
    "rhincodon typus": "Rhincodon typus",
    "green sea turtle": "Chelonia mydas",
    "sea turtle": "Chelonia mydas",
    "chelonia mydas": "Chelonia mydas",
    "tiger prawn": "Penaeus monodon",
    "prawn": "Penaeus monodon",
    "penaeus monodon": "Penaeus monodon",
    "skipjack tuna": "Katsuwonus pelamis",
    "skipjack": "Katsuwonus pelamis",
    "katsuwonus pelamis": "Katsuwonus pelamis",
    "grouper": "Epinephelus coioides",
    "epinephelus coioides": "Epinephelus coioides"
}

def standardize_date(raw_date: Any) -> Optional[datetime]:
    """
    Parses messy dates into clean UTC datetime.
    Supports ISO strings, DD/MM/YYYY, MM/DD/YYYY, Excel integer dates, timestamps.
    """
    if raw_date is None or pd.isna(raw_date):
        return datetime.now(timezone.utc)

    if isinstance(raw_date, datetime):
        return raw_date if raw_date.tzinfo else raw_date.replace(tzinfo=timezone.utc)

    # Handle Excel float/integer serial dates (e.g., 45500)
    if isinstance(raw_date, (int, float)) and not np.isnan(raw_date):
        try:
            # Excel base date is 1899-12-30
            dt = pd.to_datetime(raw_date, unit="D", origin="1899-12-30")
            return dt.to_pydatetime().replace(tzinfo=timezone.utc)
        except Exception:
            pass

    date_str = str(raw_date).strip()
    try:
        # Standard ISO YYYY-MM-DD format
        if re.match(r"^\d{4}-\d{1,2}-\d{1,2}", date_str):
            dt = pd.to_datetime(date_str, errors="coerce", dayfirst=False)
        else:
            dt = pd.to_datetime(date_str, errors="coerce", dayfirst=True)
        if pd.notna(dt):
            return dt.to_pydatetime().replace(tzinfo=timezone.utc)
    except Exception:
        pass

    return datetime.now(timezone.utc)

def parse_coordinate_string(coord_str: Any) -> Optional[float]:
    """
    Converts diverse latitude/longitude representations to decimal float:
    e.g., '18°30\'15"N', '72.85W', '18.5200', ' 15 deg 20 min S '
    """
    if coord_str is None or pd.isna(coord_str):
        return None

    if isinstance(coord_str, (int, float)):
        return float(coord_str)

    s = str(coord_str).strip().upper()

    # Detect direction suffix or prefix
    is_negative = ("S" in s) or ("W" in s) or s.startswith("-")

    # Match Degrees Minutes Seconds e.g. 18° 30' 15" N or 18d 30m 15s
    dms_match = re.search(r'(\d+)[°|D|\s]+(\d+)[\'|M|\s]+([\d\.]+)?[\"|S]?', s)
    if dms_match:
        deg = float(dms_match.group(1))
        minute = float(dms_match.group(2))
        sec = float(dms_match.group(3)) if dms_match.group(3) else 0.0
        val = deg + (minute / 60.0) + (sec / 3600.0)
        return -val if is_negative else val

    # Clean numeric characters
    cleaned = re.sub(r'[^\d\.\-]', '', s)
    try:
        val = float(cleaned)
        return -abs(val) if is_negative else val
    except ValueError:
        return None

def standardize_species_name(raw_name: Any) -> str:
    """
    Cleans typos, capitalizes scientific Binomial nomenclature (Genus species),
    and normalizes common names to standard scientific Latin name.
    """
    if not raw_name or pd.isna(raw_name):
        return "Unknown marine organism"

    s = str(raw_name).strip().lower()
    # Remove common qualifiers like 'sp.', 'cf.', brackets
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'\b(sp\.|spp\.|cf\.|subsp\.)\b', '', s).strip()

    # Dictionary match
    if s in TAXONOMIC_REFERENCE:
        return TAXONOMIC_REFERENCE[s]

    # Otherwise format as Genus species
    parts = s.split()
    if len(parts) >= 2:
        genus = parts[0].capitalize()
        species = parts[1].lower()
        return f"{genus} {species}"
    elif len(parts) == 1:
        return parts[0].capitalize()

    return s.capitalize()

def parse_uploaded_file(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, str]:
    """
    Parses an uploaded file into a Pandas DataFrame.
    Supports CSV, Excel (.xlsx, .xls), JSON, and FASTA.
    Returns: (DataFrame, detected_category)
    """
    fn_lower = filename.lower()

    if fn_lower.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(file_bytes))
    elif fn_lower.endswith(".json"):
        data = json.loads(file_bytes.decode("utf-8"))
        df = pd.json_normalize(data)
    elif fn_lower.endswith((".fasta", ".fa", ".fna")):
        # Parse FASTA into a DataFrame with headers and sequences
        lines = file_bytes.decode("utf-8").splitlines()
        fasta_records = []
        current_header = None
        current_seq = []
        for line in lines:
            line = line.strip()
            if line.startswith(">"):
                if current_header:
                    fasta_records.append({"sample_id": current_header, "dna_sequence": "".join(current_seq)})
                current_header = line[1:]
                current_seq = []
            else:
                current_seq.append(line.upper())
        if current_header:
            fasta_records.append({"sample_id": current_header, "dna_sequence": "".join(current_seq)})
        df = pd.DataFrame(fasta_records)
    else:
        # Default: CSV or TSV
        sep = "\t" if fn_lower.endswith(".tsv") else ","
        df = pd.read_csv(io.BytesIO(file_bytes), sep=sep)

    # Standardize column headers
    df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

    # Auto-detect category using flexible substring matching
    cols = list(df.columns)
    if any(any(k in c for k in ["dna", "sequence", "marker", "reads", "otu", "fasta"]) for c in cols):
        category = "EDNA_GENOMICS"
    elif any(any(k in c for k in ["vessel", "catch", "gear", "fish", "landing", "fleet"]) for c in cols):
        category = "FISHERIES"
    elif any(any(k in c for k in ["species", "scientific_name", "taxon", "organism"]) for c in cols):
        category = "SPECIES_CATALOG"
    else:
        category = "OCEANOGRAPHIC"

    return df, category

def harmonize_dataframe(df: pd.DataFrame, category: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans and standardizes all columns based on category.
    Returns: (harmonized_df, cleaning_stats)
    """
    df = df.copy()
    stats = {
        "original_rows": len(df),
        "dates_standardized": 0,
        "dates_harmonized": 0,
        "locations_fixed": 0,
        "locations_standardized": 0,
        "species_names_normalized": 0
    }

    # 1. Clean dates
    date_cols = [c for c in df.columns if any(w in c for w in ["date", "time", "timestamp"])]
    for c in date_cols:
        df[c] = df[c].apply(standardize_date)
        stats["dates_standardized"] += len(df)
        stats["dates_harmonized"] += len(df)

    # 2. Clean locations (Latitude / Longitude)
    lat_cols = [c for c in df.columns if any(w in c for w in ["lat", "latitude"])]
    lon_cols = [c for c in df.columns if any(w in c for w in ["lon", "longitude", "lng"])]

    for c in lat_cols:
        df[c] = df[c].apply(parse_coordinate_string)
        # Clamp latitude -90..90
        df[c] = df[c].clip(lower=-90.0, upper=90.0)
        stats["locations_fixed"] += 1
        stats["locations_standardized"] += 1

    for c in lon_cols:
        df[c] = df[c].apply(parse_coordinate_string)
        # Clamp longitude -180..180
        df[c] = df[c].clip(lower=-180.0, upper=180.0)
        stats["locations_fixed"] += 1
        stats["locations_standardized"] += 1

    # 3. Clean species names
    species_cols = [c for c in df.columns if any(w in c for w in ["species", "scientific_name", "fish", "organism", "taxa"])]
    for c in species_cols:
        df[c] = df[c].apply(standardize_species_name)
        stats["species_names_normalized"] += len(df)

    # Standardize column naming for key targets
    for col in df.columns:
        if any(w in col for w in ["temp", "sst", "temperature"]):
            df = df.rename(columns={col: "temperature"})
            break
    for col in df.columns:
        if col != "temperature" and any(w in col for w in ["lat", "latitude"]):
            df = df.rename(columns={col: "latitude"})
            break
    for col in df.columns:
        if col not in ["temperature", "latitude"] and any(w in col for w in ["lon", "lng", "longitude"]):
            df = df.rename(columns={col: "longitude"})
            break

    # Remove completely empty rows
    df = df.dropna(how="all")
    stats["clean_rows"] = len(df)

    return df, stats
