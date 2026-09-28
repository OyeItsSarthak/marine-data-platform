import pandas as pd
import numpy as np

def assign_marine_ecomanagement_region(lat: float, lon: float) -> str:
    """Classify coordinates into standard oceanographic and ecological basins."""
    if 65.0 <= lon <= 77.5 and 7.0 <= lat <= 25.0:
        return "Arabian Sea (Eastern Basin)"
    elif 77.5 < lon <= 95.0 and 8.0 <= lat <= 24.0:
        return "Bay of Bengal"
    elif 71.0 <= lon <= 74.5 and 8.0 <= lat <= 13.0:
        return "Lakshadweep Sea"
    elif 91.0 <= lon <= 94.5 and 6.0 <= lat <= 14.5:
        return "Andaman & Nicobar Waters"
    elif lat < 8.0:
        return "Equatorial Indian Ocean"
    return "Indian Ocean Sector"

def transform_ocean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies spatial enrichment, regional categorization,
    and ecological front calculations to oceanographic records.
    """
    df = df.copy()

    # Standardize column naming
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Coordinate precision
    if "latitude" in df.columns:
        df["latitude"] = df["latitude"].round(4)
    if "longitude" in df.columns:
        df["longitude"] = df["longitude"].round(4)

    # Physical measurements precision
    if "temperature" in df.columns:
        df["temperature"] = df["temperature"].round(2)
    if "salinity" in df.columns:
        df["salinity"] = df["salinity"].round(2)

    # Ecological Basin Classification
    if "latitude" in df.columns and "longitude" in df.columns:
        df["region"] = [
            assign_marine_ecomanagement_region(row["latitude"], row["longitude"])
            for _, row in df.iterrows()
        ]

    # Upwelling Indicator Proxy:
    # Coastal upwelling brings cold (<28.0°C), highly saline (>35.0 PSU) water to the surface.
    if "temperature" in df.columns and "salinity" in df.columns:
        df["upwelling_potential"] = (
            (df["temperature"] < 28.5).astype(int) * 0.5 +
            (df["salinity"] > 35.0).astype(int) * 0.5
        ).round(2)

    return df

def main():
    input_file = "data/processed/ocean_observations_cleaned.csv"
    output_file = "data/processed/ocean_observations_final.csv"
    try:
        df = pd.read_csv(input_file)
        transformed_df = transform_ocean_dataframe(df)
        transformed_df.to_csv(output_file, index=False)
        print(f"[Transform] Transformed {len(transformed_df)} records. Saved to {output_file}")
    except Exception as e:
        print(f"[Transform] Error: {e}")

if __name__ == "__main__":
    main()