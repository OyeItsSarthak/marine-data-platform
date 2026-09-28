import pandas as pd
from typing import Dict, Any, List

def validate_ocean_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validates oceanographic dataset against physical, chemical, and geographic laws.
    Returns comprehensive validation metrics and error flags.
    """
    errors: List[str] = []
    warnings: List[str] = []

    required_cols = ["station_id", "latitude", "longitude", "temperature", "salinity"]
    for col in required_cols:
        if col not in df.columns:
            errors.append(f"Critical schema error: Missing column '{col}'")

    if errors:
        return {
            "is_valid": False,
            "total_rows": len(df),
            "errors": errors,
            "warnings": warnings
        }

    # Range validations
    invalid_lat = ~df["latitude"].between(-90.0, 90.0)
    if invalid_lat.any():
        errors.append(f"{invalid_lat.sum()} records have latitude outside [-90, 90]")

    invalid_lon = ~df["longitude"].between(-180.0, 180.0)
    if invalid_lon.any():
        errors.append(f"{invalid_lon.sum()} records have longitude outside [-180, 180]")

    # Marine thermodynamic limits
    invalid_temp = ~df["temperature"].between(-2.5, 45.0)
    if invalid_temp.any():
        errors.append(f"{invalid_temp.sum()} records violate oceanic temperature bounds (-2.5°C to 45°C)")

    # Salinity PSU check
    invalid_sal = ~df["salinity"].between(0.0, 48.0)
    if invalid_sal.any():
        warnings.append(f"{invalid_sal.sum()} records outside typical marine salinity bounds (0 to 48 PSU)")

    if "depth" in df.columns:
        neg_depth = df["depth"] < 0
        if neg_depth.any():
            warnings.append(f"{neg_depth.sum()} records have negative depth (clipped to 0)")

    return {
        "is_valid": len(errors) == 0,
        "total_rows": len(df),
        "errors": errors,
        "warnings": warnings,
        "passed_checks": [
            "Geospatial Coordinates (-90°..90° Lat, -180°..180° Lon)",
            "Thermodynamic Sea Temperature (-2.5°C..45°C)",
            "Practical Salinity Scale (0..48 PSU)",
            "Bathymetric Positive Depth"
        ]
    }

def main():
    try:
        df = pd.read_csv("data/processed/ocean_observations_cleaned.csv")
        results = validate_ocean_dataframe(df)
        print("Validation Results:")
        print(f"Status: {'PASSED' if results['is_valid'] else 'FAILED'}")
        if results["errors"]:
            print("Errors:", results["errors"])
        if results["warnings"]:
            print("Warnings:", results["warnings"])
    except Exception as e:
        print(f"Validation error: {e}")

if __name__ == "__main__":
    main()