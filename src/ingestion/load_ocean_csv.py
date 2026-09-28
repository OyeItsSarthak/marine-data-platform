import pandas as pd

file_path = "data/raw/ocean_observations.csv"

df = pd.read_csv(file_path)

print("Ocean data loaded successfully!")
print(df)

print("\nColumns:")
print(df.columns)

print("\nData types:")
print(df.dtypes)

print("\nNumber of rows:")
print(len(df))

print("\nFirst 5 rows:")
print(df.head())

print("\nBasic statistics:")
print(df.describe())

print("\nMissing values:")
print(df.isnull().sum())

average_temperature = df["temperature"].mean()
print(f"Average temperature: {average_temperature:.2f} °C")

temp_greater29 = df["temperature"] > 29
print(f"Number of observations with temperature > 29°C: {temp_greater29.sum()}")

highest_salinity = df.loc[df["salinity"].idxmax()]

print("Highest salinity observation:")
print(highest_salinity)