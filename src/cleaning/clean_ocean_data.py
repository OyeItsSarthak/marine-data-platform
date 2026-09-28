import pandas as pd
import numpy as np

def clean_ocean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardizes and cleans oceanographic observations DataFrame.
    Handles missing values, casts types, and enforces scientific bounds.
    """
    df = df.copy()

    # Drop fully empty records
    df = df.dropna(how="all")

    # Standardize column headers
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Parse timestamps
    if "observation_date" in df.columns:
        df["observation_date"] = pd.to_datetime(df["observation_date"], errors="coerce")
    elif "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    # Numeric casts
    numeric_cols = [
        "latitude", "longitude", "temperature", "salinity",
        "depth", "chlorophyll", "dissolved_oxygen", "wave_height",
        "current_velocity", "current_direction"
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Bounds clipping / sanitation for ocean physics
    if "latitude" in df.columns:
        df = df[df["latitude"].between(-90.0, 90.0)]
    if "longitude" in df.columns:
        df = df[df["longitude"].between(-180.0, 180.0)]
    if "depth" in df.columns:
        df["depth"] = df["depth"].clip(lower=0.0)

    # Impute missing thermal/salinity with median if present
    if "temperature" in df.columns and df["temperature"].isnull().any():
        median_temp = df["temperature"].median()
        df["temperature"] = df["temperature"].fillna(median_temp if not np.isnan(median_temp) else 28.0)

    if "salinity" in df.columns and df["salinity"].isnull().any():
        median_sal = df["salinity"].median()
        df["salinity"] = df["salinity"].fillna(median_sal if not np.isnan(median_sal) else 35.0)

    return df

def main():
    input_file = "data/raw/ocean_observations.csv"
    output_file = "data/processed/ocean_observations_cleaned.csv"
    try:
        df = pd.read_csv(input_file)
        cleaned_df = clean_ocean_dataframe(df)
        cleaned_df.to_csv(output_file, index=False)
        print(f"[Cleaning] Successfully cleaned {len(cleaned_df)} rows and saved to {output_file}")
    except Exception as e:
        print(f"[Cleaning] Error processing CSV: {e}")

if __name__ == "__main__":
    main()