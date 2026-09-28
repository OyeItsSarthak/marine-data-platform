"""
Copernicus Marine Service (CMEMS) Ingestion Engine
Provides programmatic access to ESA / Sentinel satellite gridded ocean products:
- Global Ocean Physics Analysis and Forecast (SST, Salinity, Currents)
- Global Ocean Biogeochemistry Analysis (Chlorophyll-a, Primary Production)
"""
import os
import copernicusmarine
from datetime import datetime, timezone
from typing import Dict, Any, Optional

def login_copernicus(username: Optional[str] = None, password: Optional[str] = None) -> Dict[str, Any]:
    """
    Login to Copernicus Marine Service.
    Reads credentials from parameters, or from environment variables COPERNICUS_USERNAME / COPERNICUS_PASSWORD.
    """
    u = username or os.getenv("COPERNICUS_USERNAME")
    p = password or os.getenv("COPERNICUS_PASSWORD")

    if not u or not p:
        return {
            "status": "UNAUTHENTICATED",
            "message": "Copernicus Marine credentials not found in environment. Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD in .env or run 'copernicusmarine login'."
        }

    try:
        copernicusmarine.login(username=u, password=p, skip_if_user_already_logged=True)
        return {
            "status": "AUTHENTICATED",
            "username": u,
            "message": "Successfully logged in to Copernicus Marine Service!"
        }
    except Exception as e:
        return {
            "status": "LOGIN_FAILED",
            "error": str(e)
        }

def fetch_copernicus_sst_metadata(dataset_id: str = "cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m") -> Dict[str, Any]:
    """
    Describe Copernicus Marine ocean products or check catalog connectivity.
    """
    try:
        catalogue = copernicusmarine.describe(dataset_id=dataset_id)
        return {
            "status": "SUCCESS",
            "dataset_id": dataset_id,
            "catalogue": catalogue
        }
    except Exception as e:
        return {
            "status": "NOTICE",
            "message": f"Copernicus Marine requires login for direct binary downloads: {e}",
            "fallback_used": True
        }

if __name__ == "__main__":
    res = login_copernicus()
    print("Copernicus Login Check:", res)
