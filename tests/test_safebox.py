import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from src.api.main import app
from src.cleaning.harmonizer import (
    parse_uploaded_file,
    harmonize_dataframe,
    standardize_date,
    parse_coordinate_string,
    standardize_species_name
)

client = TestClient(app)

def test_standardize_date():
    # Various messy datetime formats
    assert standardize_date("12/05/2024") is not None
    assert standardize_date("2024-05-12 14:30:00") is not None
    assert standardize_date("15-Jan-2023") is not None
    assert standardize_date(None) is not None

def test_parse_coordinate():
    # Decimal string
    assert parse_coordinate_string("18.524") == 18.524
    # DMS format
    lat_dms = parse_coordinate_string("18° 30' 00\" N")
    assert lat_dms is not None
    assert abs(lat_dms - 18.5) < 0.01
    
    lon_dms = parse_coordinate_string("72° 45' 00\" E")
    assert lon_dms is not None
    assert abs(lon_dms - 72.75) < 0.01

def test_normalize_species_name():
    # Common to scientific & canonical mapping
    assert standardize_species_name("yellowfin tuna") == "Thunnus albacares"
    assert standardize_species_name("THUNNUS ALBACARES") == "Thunnus albacares"
    assert standardize_species_name("whale shark") == "Rhincodon typus"
    assert standardize_species_name("indian mackerel") == "Rastrelliger kanagurta"

def test_harmonize_oceanographic_csv():
    csv_data = """Date,Lat,Lon,Water_Temperature,Salinity_PSU
01/06/2024,18° 30' N,72° 50' E,28.4,35.1
02/06/2024,18.60,72.90,28.7,35.2
"""
    df, category = parse_uploaded_file(csv_data.encode("utf-8"), "buoy_survey.csv")
    assert category == "OCEANOGRAPHIC"
    
    clean_df, stats = harmonize_dataframe(df, category)
    assert stats["dates_harmonized"] == 2
    assert stats["locations_standardized"] >= 1
    assert "temperature" in clean_df.columns
    assert "latitude" in clean_df.columns

def test_harmonize_fisheries_excel():
    df_raw = pd.DataFrame({
        "Trip_Date": ["2024-04-10", "11/04/2024"],
        "Latitude": [15.2, 15.5],
        "Longitude": [73.8, 73.9],
        "Target_Fish": ["Yellowfin Tuna", "Indian Mackerel"],
        "Catch_KG": [450.0, 320.0]
    })
    
    buffer = io.BytesIO()
    df_raw.to_excel(buffer, index=False, engine="openpyxl")
    excel_bytes = buffer.getvalue()
    
    df, category = parse_uploaded_file(excel_bytes, "catch_log.xlsx")
    assert category == "FISHERIES"
    
    clean_df, stats = harmonize_dataframe(df, category)
    assert stats["species_names_normalized"] == 2
    assert clean_df["target_fish"].iloc[0] == "Thunnus albacares"

def test_api_safebox_upload():
    csv_content = """Date,Latitude,Longitude,Temperature,Salinity
2024-09-01,17.45,71.80,28.9,35.4
2024-09-02,17.50,71.85,29.1,35.3
"""
    res = client.post(
        "/api/safebox/upload",
        files={"file": ("survey_data.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["records_saved_to_db"] == 2
    assert "cleaning_stats" in data
    assert len(data["preview"]) == 2
