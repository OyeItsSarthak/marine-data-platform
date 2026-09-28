# Triton Oceanic AI: Comprehensive Architecture & Build Guide
## Unified Data Platform for Oceanographic, Fisheries, and Molecular Biodiversity Insights

An enterprise/research-grade unified marine intelligence platform that brings together three critical disparate data pillars:
1. **Physical & Chemical Oceanography** (Sea Surface Temperature, Salinity, Chlorophyll-a, Ocean Currents, Wave Dynamics, Vertical CTD Profiles).
2. **Fisheries Dynamics & Fleet Telemetry** (Real-time AIS vessel tracking, catch biomass, fishing effort, and AI-predicted Potential Fishing Zones).
3. **Molecular Biodiversity & Environmental Genomics (eDNA)** (Metabarcoding amplicons from 12S rRNA & COI markers, Shannon-Wiener Diversity Indices, and IUCN Red List alerts).

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |         Live External Data Feeds       |
                                  |  - Open-Meteo Marine API (Waves, SST) |
                                  |  - OBIS / GBIF API (Biodiversity)     |
                                  |  - Real-Time AIS Stream (Fisheries)   |
                                  |  - eDNA Molecular Sequencer Samples   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |    Multi-Domain ETL & Orchestrator    |
                                  |  - src/cleaning/clean_ocean_data.py   |
                                  |  - src/validation/validate_ocean.py   |
                                  |  - src/transformation/transform.py    |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |      Unified Marine Data Storage      |
                                  |     PostgreSQL (with SQLite Fallback) |
                                  |  - ocean_observations                 |
                                  |  - fisheries_records                  |
                                  |  - edna_samples                       |
                                  |  - pipeline_logs                      |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
       +-----------------------------------+                     +-----------------------------------+
       |     AI Models & Analytics         |                     |     FastAPI REST & WebSockets     |
       |  - PFZ Classifier (RandomForest)  |                     |  - GET /api/ocean/live            |
       |  - Marine Heatwave (Hobday 2016)  |                     |  - GET /api/fisheries/pfz         |
       |  - Cross-Correlator Coupling      | <=================> |  - GET /api/biodiversity/edna     |
       |  - GenAI Marine Copilot (Triton)  |                     |  - POST /api/ai/chat              |
       +-----------------------------------+                     |  - WS  /ws/live                   |
                                                                 +-----------------+-----------------+
                                                                                   |
                                                                                   v
                                                                 +-----------------------------------+
                                                                 |     Command Center Dashboard      |
                                                                 |  - Interactive Leaflet GIS Map    |
                                                                 |  - Live Chart.js Analytics Suite  |
                                                                 |  - Slide-Over AI Copilot Drawer   |
                                                                 +-----------------------------------+
```

---

## 2. Multi-Domain Data Specifications

### 2.1 Physical Oceanography
- **Sea Surface Temperature (SST)**: Calibrated in °C. Real-time telemetry fetched via Open-Meteo Marine API.
- **Salinity**: Practical Salinity Units (PSU).
- **Chlorophyll-a**: Proxy for phytoplankton biomass ($mg/m^3$).
- **Dissolved Oxygen**: Assessed for hypoxia risks ($mg/L$).
- **Wave Height & Current Vectors**: Real-time wave height ($m$), period ($s$), current velocity ($m/s$), and direction (°).

### 2.2 Fisheries Dynamics & Fleet Telemetry
- **AIS Vessel Tracking**: Identifies commercial vessels (`vessel_id`, `vessel_name`, `gear_type`, `speed`, `heading`).

- **Gear Types**: Pelagic Trawler, Longliner, Purse Seine, Gillnet.
- **Catch Biomass**: Measured in kilograms ($kg$) per haul.
- **CPUE**: Catch Per Unit Effort ($\frac{Catch (kg)}{Effort (hours)}$).

### 2.3 Molecular Biodiversity & Environmental Genomics (eDNA)
- **Target Barcode Primers**:
  - **12S rRNA (MiFish)**: Teleost fish and elasmobranchs.
  - **COI (Leray-Folmer)**: Marine invertebrates (crustaceans, mollusks, corals).
  - **18S rRNA**: Eukaryotic microplankton.
- **Shannon-Wiener Diversity Index ($H'$)**:
  $$H' = -\sum_{i=1}^{S} p_i \ln(p_i)$$
  where $p_i = \frac{n_i}{N}$ is the relative read abundance of species $i$.
- **Simpson Diversity Index ($D$)**:
  $$D = 1 - \sum_{i=1}^{S} p_i^2$$

---

## 3. Machine Learning & Predictive Engines

### 3.1 AI Potential Fishing Zone (PFZ) Predictor (`src/ai/pfz_predictor.py`)
- **Algorithm**: Random Forest Classifier trained on physical oceanographic features:
  - Thermal gradient: $\nabla SST = \sqrt{\left(\frac{\partial SST}{\partial x}\right)^2 + \left(\frac{\partial SST}{\partial y}\right)^2}$
  - Chlorophyll-a front index
  - Ocean current convergence/divergence
  - Bathymetric depth
- **Outputs**:
  - Probability match score ($0 - 100\%$)
  - Categorization: *High Potential*, *Moderate Potential*, *Low Potential*
  - Target species forecast & optimal fishing depth strata

### 3.2 Marine Heatwave (MHW) Detector (`src/ai/marine_heatwave.py`)
- **Framework**: Hobday et al. (2016) standard definition.
- **Severity Categories**:
  - *Category I (Moderate)*: $1\times$ to $2\times$ threshold anomaly
  - *Category II (Strong)*: $2\times$ to $3\times$ threshold anomaly
  - *Category III (Severe)*: $3\times$ to $4\times$ threshold anomaly
  - *Category IV (Extreme)*: $>4\times$ threshold anomaly
- **Biological Risks**: Coral bleaching stress and hypoxia warning ($DO < 3.5\text{ mg/L}$).

### 3.3 Triton Marine GenAI Copilot (`src/ai/copilot.py`)
- **Real-Time Google Gemini Generative AI Engine**:
  - Direct integration with Google Generative Language API (`GEMINI_API_KEY`).
  - Powered by `gemini-flash-lite-latest` with multi-model failover cascade (`gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`).
  - Injects live telemetry into system prompt: SST anomalies, AIS fleet positions, Hobday et al. heatwaves, eDNA metabarcoding indices.
  - Answers ANY question (marine physics, ecology, species identification, or general inquiries).
  - Dynamic follow-up action suggestions rendered as interactive clickable pills.
  - Fully offline-resilient: automatically falls back to local deterministic marine heuristics if network or quota is unavailable.

---

## 4. Quickstart & Execution Guide

### 4.1 Prerequisites
- Python 3.10+ (tested on Python 3.13)
- PostgreSQL (optional: automatic SQLite fallback if PostgreSQL is not active)

### 4.2 Installation
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt
```

### 4.3 Environment Configuration (`.env`)
```ini
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marine_db
DB_USER=postgres
DB_PASSWORD=your_password

# Google Gemini API Key for Real-Time Marine AI Copilot
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-lite-latest
```
*(Note: If PostgreSQL is unreachable, the system automatically uses local SQLite at `data/marine_platform.db` with zero configuration needed).*

### 4.4 Run Automated Tests
```powershell
.\venv\Scripts\pytest.exe -v
```

### 4.5 Start the Command Center Platform
```powershell
.\venv\Scripts\python.exe -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser and navigate to:
**`http://127.0.0.1:8000`**

### 4.6 Manual Pipeline Trigger
You can trigger live data ingestion at any time via:
- The UI button **`Run ETL Pipeline`** in the dashboard header
- CLI command: `python -m src.pipeline.orchestrator`
- REST API: `POST /api/pipeline/run`
