# Triton Oceanic AI: Unified Marine Intelligence & Genomics Platform

An AI-driven unified data platform integrating **Physical Oceanography**, **Fisheries Dynamics**, and **Molecular Biodiversity (eDNA)** to generate cross-domain marine insights with real-time streaming data.

---

## 🌟 Key Features

- 📦 **The Safe Box (Data Ingestion Drop Box)**: Digital drop box for scientists to upload Excel sheets (`.xlsx`, `.xls`), CSVs, JSON, and FASTA files. Triton AI automatically harmonizes messy dates, GPS coordinates, and species names into clean records stored in PostgreSQL.
- 🧬 **The DNA Matcher**: Instant nucleotide sequence reader (A, C, G, T) that matches against 12S rRNA & COI reference barcodes to identify the organism name, full taxonomic lineage, match confidence, and IUCN Red List conservation status.
- 🐟 **The Weather & Fish Predictor**: 7-day pelagic fish migration forecasting engine tracking school advection driven by water temperature gradients, ocean currents, and shelf breaks.
- 🎯 **The Smart Map (Ocean Patch Inspector)**: Interactive Leaflet GIS map allowing users to click on any patch of ocean to immediately inspect live water temperature, salinity, wave height, fish presence likelihood, and nearby historical eDNA samples.
- 🛰️ **Real-Time Oceanography**: Live wave height, ocean current velocity/direction, Sea Surface Temperature (SST), and salinity from the **Open-Meteo Marine API** and NOAA/INCOIS baselines.
- 🚢 **Live Fleet Telemetry (AIS)**: Real-time vessel monitoring, catch biomass, gear types (Trawlers, Longliners, Purse Seines), and CPUE metrics.
- 🎣 **AI Potential Fishing Zones (PFZ)**: Machine learning predictive model combining thermal fronts ($\nabla SST$) and chlorophyll-a to forecast pelagic fish aggregation hotspots.
- 🌊 **Marine Heatwave (MHW) Early Warning**: Automated detection adhering to the **Hobday et al. (2016)** oceanographic standard with hypoxia and coral bleaching advisories.
- 🤖 **GenAI Marine Copilot (Triton)**: Natural language conversational interface capable of answering complex marine queries, diagnosing anomalies, and generating cross-domain executive state briefs.
- 🛡️ **Resilient Data Architecture**: Enterprise PostgreSQL with URL-safe credential encoding and zero-config automatic SQLite fallback.

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Run Automated Test Suite
```powershell
pytest -v
```
*(31 comprehensive tests verifying database, real-time ingestion, AI models, Safe Box harmonization, DNA matching, and 7-day migration forecasting).*

### 3. Launch Platform
```powershell
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **`http://127.0.0.1:8000`** in your browser.

---

## 📁 Repository Structure

```
marine-data-platform/
├── buid_guide.md                     # Comprehensive technical documentation & formulas
├── README.md                          # Project overview & quickstart
├── requirements.txt                   # Production Python dependencies
├── data/                              # Raw and processed marine data stores
├── src/
│   ├── ai/
│   │   ├── copilot.py                 # GenAI Marine Copilot reasoning engine
│   │   ├── cross_correlator.py        # Cross-domain statistical coupling
│   │   ├── marine_heatwave.py         # Hobday et al. MHW detector
│   │   └── pfz_predictor.py           # Random Forest AI PFZ predictor
│   ├── api/
│   │   └── main.py                    # FastAPI REST & WebSocket server
│   ├── cleaning/
│   │   └── clean_ocean_data.py        # Robust missing-value & bound sanitization
│   ├── database/
│   │   ├── connection.py              # Resilient PostgreSQL / SQLite engine
│   │   └── models.py                  # SQLAlchemy 2.0 ORM models & auto-migrations
│   ├── ingestion/
│   │   ├── edna_molecular.py          # eDNA metabarcoding & Shannon index
│   │   ├── fisheries_stream.py        # Real-time AIS vessel telemetry feed
│   │   ├── obis_biodiversity.py       # Live OBIS marine biodiversity client
│   │   └── ocean_realtime.py          # Live Open-Meteo Marine API client
│   ├── pipeline/
│   │   └── orchestrator.py            # Unified automated ETL pipeline
│   ├── static/                        # Command center dashboard frontend
│   │   ├── css/styles.css             # Abyssal dark glassmorphism styling
│   │   ├── js/app.js                  # Leaflet GIS, WebSocket, and Chart.js logic
│   │   └── index.html                 # Main command center dashboard
│   ├── transformation/
│   │   └── transform_ocean_data.py    # Spatial & upwelling feature engineering
│   └── validation/
│       └── validate_ocean_data.py     # Thermodynamic & coordinate bounds check
└── tests/
    ├── test_ai_models.py              # AI PFZ, MHW, and Copilot tests
    ├── test_api.py                    # FastAPI endpoint integration tests
    ├── test_database.py               # Database ORM & session tests
    └── test_ingestion.py              # Live API ingestion & eDNA tests
```

---

## 🔬 Scientific Foundations
- **Shannon-Wiener Index**: $H' = -\sum p_i \ln(p_i)$
- **Marine Heatwaves**: Excess heat over 90th percentile baseline (Hobday et al., 2016)
- **Potential Fishing Zones**: Front detection from satellite thermal and chlorophyll gradients (INCOIS/NOAA methodology)