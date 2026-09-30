# 🌊 Triton Oceanic AI Platform & Matsya AI
## Comprehensive Architectural Guide & Master Study Plan

---

## 📌 Executive Summary

### 1. What It Is
The **Triton Oceanic AI Platform** is a unified, multi-domain marine intelligence and operational oceanography system. It bridges the historical divide between three siloed branches of marine science:
1. **Physical Oceanography** (Sea surface temperature, salinity, wave height, thermoclines, sound velocity profiles, and currents).
2. **Fisheries & Maritime Dynamics** (Vessel AIS telemetry, catch logs, gear types, effort hours, and Potential Fishing Zones / PFZs).
3. **Marine Genomics & Environmental DNA (eDNA)** (12S rRNA / COI metabarcoding, taxonomic identification, Shannon-Wiener biodiversity indices, and IUCN Red List monitoring).

Integrated directly into the system is **Matsya AI**, a real-time conversational ocean intelligence copilot powered by Google Gemini and live oceanographic grounding.

---

### 2. What It Does
* **Global Real-Time Observation**: Ingests live satellite observations, marine weather models, and oceanic parameters across 30+ global ocean stations spanning the Arabian Sea, Bay of Bengal, Pacific, Atlantic, Mediterranean, and Polar oceans.
* **Smart Ocean CTD Probe**: Enables users to click any arbitrary coordinate across the global ocean to retrieve live sea temperatures, practical salinity, acoustic sound speed (via the 9-term Mackenzie equation), thermocline gradients, water mass classifications, and probable pelagic fish assemblages.
* **The Safe Box (Automated Harmonizer)**: An intelligent ingestion drop-box that allows marine scientists and fishery officers to drag and drop messy, non-standard Excel (.xlsx), CSV, JSON, or FASTA files. The platform automatically repairs non-decimal GPS coordinates, aligns divergent date formats into UTC timestamps, and normalizes colloquial vernacular fish names into canonical scientific taxonomy (WoRMS).
* **The DNA Sequence Scanner**: An on-the-fly molecular matcher that accepts raw genetic sequences (e.g. `ATGC...`) and accurately identifies the marine species, taxonomic hierarchy, conservation status (IUCN Red List), and habitat depth.
* **7-Day Pelagic Fish Migration Predictor**: Dynamically advects migratory fish schools based on thermal front shifts, upwelling boundaries, and kinetic drift over a rolling weekly window.
* **Matsya AI Copilot**: A multi-domain conversational assistant with live telemetry grounding capable of diagnosing marine heatwaves (Hobday scale), recommending PFZ coordinates, analyzing genomics, and synthesizing ecosystem state briefs.
* **Automated Multi-Domain ETL Pipeline**: Orchestrates live data extraction from Open-Meteo, NOAA ERDDAP, and OBIS, runs cleaning and validation transforms, and streams live progress logs over Server-Sent Events (SSE) and WebSockets.

---

### 3. How It Is Helpful (Real-World Impact)

| User Stakeholder | Traditional Pain Point | Platform Solution |
| :--- | :--- | :--- |
| **Marine Biologists & Ecologists** | eDNA samples, biodiversity surveys, and physical ocean buoy data exist in isolated spreadsheets with conflicting formats. | Unified spatio-temporal catalog with automated Shannon diversity calculations and IUCN conservation status alerts. |
| **Fisheries Management & Coastal Fleets** | Traditional PFZ advisories take days to process and provide low-resolution polygons without vessel safety checks. | Machine learning thermal-chlorophyll front detection, real-time catch-per-unit-effort (CPUE) metrics, and live wave/wind hazard alerts. |
| **Oceanographers & Acoustic Researchers** | Calculating underwater sound speed profiles and thermoclines requires manual numerical scripts. | Automated Mackenzie acoustic velocity computation ($m/s$) and continuous 0–500m depth profiles. |
| **Maritime Authorities & Coast Guard** | High volume of disparate catch reports and vessel logs with coordinate typos and non-standard fish names. | **The Safe Box** auto-cleans, validates, geocodes, and deduplicates legacy catch records before committing to PostgreSQL. |

---

## 🛠️ Complete Tech Stack

```
                     ┌──────────────────────────────────────────────────┐
                     │            FRONTEND / CLIENT LAYER              │
                     │  Vanilla CSS3 (Glassmorphism, Neon Cyberpunk)   │
                     │  Modern ES6+ JavaScript (Event-Driven Reactive) │
                     │  Leaflet.js 1.9.4 (Satellite, Bathymetry GIS)   │
                     │  HTML5 Responsive Layout with Draggable Modals  │
                     └─────────────────────────▲────────────────────────┘
                                               │ HTTP REST / SSE / WebSocket
                     ┌─────────────────────────▼────────────────────────┐
                     │             BACKEND APPLICATION API              │
                     │  FastAPI (Asynchronous High-Performance ASGI)    │
                     │  Uvicorn (ASGI Production Web Server)           │
                     │  Pydantic v2 (Strict Data Validation & Models)   │
                     └───────▲─────────────────▲────────────────▲───────┘
                             │                 │                │
            ┌────────────────┴──────┐   ┌──────┴──────┐  ┌──────┴───────────────┐
            │   DATA HARMONIZATION  │   │  AI / ML    │  │  INGESTION & ETL     │
            │   Pandas, NumPy       │   │  Scikit-    │  │  Open-Meteo API      │
            │   OpenPyXL, RegEx     │   │  Learn,     │  │  NOAA ERDDAP         │
            │   Taxonomic WoRMS     │   │  Gemini LLM │  │  OBIS Biodiversity   │
            └───────────────────────┘   └─────────────┘  └──────────────────────┘
                             │                 │                │
                     ┌───────▼─────────────────▼────────────────▼───────┐
                     │            PERSISTENCE & STORAGE LAYER           │
                     │  PostgreSQL (Primary Enterprise RDBMS)           │
                     │  SQLite (Zero-Config Development Fallback)       │
                     │  SQLAlchemy 2.0 (ORM & Connection Pooling)       │
                     └──────────────────────────────────────────────────┘
```

* **Backend Engine**: Python 3.13+, FastAPI, Uvicorn, Pydantic, Starlette.
* **Data Processing & Analytics**: Pandas, NumPy, OpenPyXL, Requests, Scikit-Learn (RandomForest).
* **Database & ORM**: SQLAlchemy 2.0, PostgreSQL (`psycopg2-binary`), SQLite fallback.
* **Generative AI & LLM**: Google Gemini API (`gemini-flash-lite-latest`, `gemini-3.7-flash`), custom grounding context builders.
* **Frontend Technologies**: HTML5, Vanilla CSS3 (Custom Design System: deep ocean dark palette `#061226`, glassmorphism, glowing telemetry accents, CSS Grid/Flexbox), ES6 JavaScript.
* **Mapping & GIS**: Leaflet.js 1.9.4, Esri World Imagery Basemap, OpenSeaMap seamarks and navigation buoys, CartoDB Dark Matter.
* **Testing & Quality Assurance**: Pytest 9.x, Starlette TestClient, AnyIO.

---

## 📂 Codebase Anatomy: What Every File Does

### 1. AI & Machine Learning Core (`src/ai/`)
* **`copilot.py`**: Houses `MarineGenAICopilot` and `copilot_ai`. Implements multi-model dispatch to Google Gemini LLM with streaming fallback heuristics for fisheries, marine heatwaves, eDNA genomics, and system prompt personas.
* **`cross_correlator.py`**: Computes holistic cross-domain correlations (e.g. coupling of sea surface temperature anomalies with commercial fish catch volumes and genomic Shannon diversity).
* **`dna_matcher.py`**: Implements the DNA Sequence Scanner algorithm. Analyzes nucleotide sequences (`A`, `T`, `G`, `C`), computes GC content, executes sub-sequence homology matching against reference marine genomes, and outputs taxonomy, depth, and IUCN Red List conservation status.
* **`marine_heatwave.py`**: Implements the scientific Hobday et al. (2016) Marine Heatwave (MHW) classification algorithm. Categorizes thermal stress into *Moderate (Category I)*, *Strong (Category II)*, *Severe (Category III)*, and *Extreme (Category IV)* based on climatological 90th percentile baselines.
* **`migration_predictor.py`**: Generates a 7-day predictive fish migration model using thermal advection vectors, simulating pelagic school trajectories across ocean basins.
* **`pfz_predictor.py`**: Potential Fishing Zone (PFZ) predictor. Evaluates thermal gradients ($\nabla \text{SST} > 0.5^\circ\text{C}$), chlorophyll-a proxies, and frontal convergence zones to generate fishing polygons with confidence probabilities.

### 2. API & Web Routing Layer (`src/api/`)
* **`main.py`**: The central application entrypoint. Initializes FastAPI, configures CORS, mounts static assets, instantiates database schemas, establishes the `/ws/live` WebSocket connection, and routes all REST and Server-Sent Event (SSE) endpoints.

### 3. Cleaning & Harmonization Layer (`src/cleaning/`)
* **`harmonizer.py`**: The core computational engine behind **The Safe Box**. Features:
  * `parse_uploaded_file()`: Autodetects file MIME types (Excel, CSV, FASTA, JSON).
  * `standardize_date()`: Normalizes ambiguous dates (e.g., `15/06/2026`, `2026-06-15`, Excel integer serials) into uniform UTC timestamps.
  * `parse_coordinate_string()`: Translates degrees-minutes-seconds (`15° 15' N`, `73° 40' E`) or noisy coordinates into decimal floating-point degrees.
  * `standardize_species_name()`: Maps vernacular and common names (e.g., `yellowfin tuna`, `oil sardine`) to WoRMS-compliant scientific binomial nomenclature (`Thunnus albacares`, `Sardinella longiceps`).
* **`clean_ocean_data.py`**: Standalone batch cleaning script for raw buoy CSV tables.

### 4. Database & Relational Modeling Layer (`src/database/`)
* **`connection.py`**: Initializes the SQLAlchemy database engine with automatic fallback: tries PostgreSQL using environment connection strings (`DATABASE_URL`), and seamlessly switches to local SQLite (`sqlite:///./marine_data.db`) if PostgreSQL is unavailable.
* **`models.py`**: Defines declarative relational ORM models:
  * `OceanObservation`: Stores physical measurements (SST, salinity, depth, wave height, currents, oxygen).
  * `FisheriesRecord`: Stores fleet catch data, vessel IDs, gear types, catch weights (kg), and effort hours.
  * `EDNASample`: Stores genomic sampling events, marker genes (12S rRNA / COI), Shannon-Wiener index ($H'$), Simpson index ($D$), and taxonomic JSON arrays.
  * `MarineSpecies`: Canonical species reference catalog with taxonomy (phylum, family, genus) and IUCN status.
  * `MarineOccurrence`: Spatio-temporal observation coordinates from OBIS and field records.
  * `PipelineLog`: Execution audits of ETL pipeline runs with record counters, status codes, and JSON execution summaries.
* **`test_connection.py`**: Database diagnostics script for validating connection pooling and table schemas.

### 5. Ingestion & External Connectors Layer (`src/ingestion/`)
* **`ocean_realtime.py`**: Dual-source physical oceanography collector. Queries Open-Meteo Marine API (waves, currents, swell) and Open-Meteo Forecast API (SST, marine wind) for real-time worldwide coordinate lookups with physical baseline fallbacks.
* **`fisheries_stream.py`**: Generates real-time simulated AIS vessel telemetry and commercial catch logs for active longliners, purse seiners, and trawlers across designated fishing zones.
* **`edna_molecular.py`**: Loads and computes environmental DNA metabarcoding records, calculating species richness and Shannon-Wiener biodiversity indices from molecular read frequencies.
* **`obis_biodiversity.py`**: Connects directly to the UNESCO Ocean Biodiversity Information System (OBIS) REST API to pull live occurrences of target marine megafauna and pelagic species.
* **`gbif_biodiversity.py`**: Integrates with the Global Biodiversity Information Facility (GBIF) for taxonomic backbones.
* **`noaa_erddap.py`**: Ingests gridded buoy tables and sea surface temperatures from NOAA ERDDAP servers.
* **`copernicus_marine.py`**: Integration connector for Copernicus Marine Service authentication and satellite products.
* **`load_ocean_csv.py`**: Utility to seed the database with initial oceanographic records.

### 6. Pipeline Orchestration (`src/pipeline/`)
* **`orchestrator.py`**: Coordinates the Unified Multi-Domain ETL Pipeline:
  * Manages sequential execution across physical oceanography, fisheries, eDNA, and OBIS.
  * Implements `stream_unified_pipeline_events()` to yield real-time execution steps and percentage counters for Server-Sent Events (SSE).

### 7. Transformation & Validation (`src/transformation/` & `src/validation/`)
* **`transform_ocean_data.py`**: Applies oceanographic feature engineering, calculating thermal anomalies and derived parameters.
* **`validate_ocean_data.py`**: Validates ranges for physical ocean variables (e.g. valid SST $-2.0^\circ\text{C} \le T \le 35.0^\circ\text{C}$, salinity $20 \le S \le 42\text{ PSU}$).

### 8. Frontend Interface (`src/static/`)
* **`index.html`**: Master Single Page Application structure. Contains the Leaflet map container, telemetry ticker, Control HUD bar, floating draggable CTD Sounding inspector, The Safe Box modal, DNA Sequence Scanner modal, and the slide-over Matsya AI chat drawer.
* **`css/styles.css`**: Complete vanilla design system featuring custom dark-mode typography, glassmorphism (`backdrop-filter: blur(16px)`), CSS grid metric displays, responsive layouts, and floating window drag-and-resize handles.
* **`js/app.js`**: Client-side application controller:
  * Initializes Leaflet map layers, layer switchers, custom SVG buoy/vessel markers, and PFZ geo-polygons.
  * Establishes real-time WebSocket connection to `/ws/live` for instantaneous map updates.
  * Powers interactive features: CTD ocean inspector, draggable windows, DNA scanner, Safe Box drag-and-drop file upload, and Matsya AI conversation logic with live progress timers.

### 9. Test Suite (`tests/`)
* **`test_api.py`**: Validates all FastAPI REST endpoints, health checks, query parameters, and JSON schemas.
* **`test_ai_models.py`**: Tests RandomForest PFZ classification, Hobday marine heatwave detection, cross-domain correlator, and Matsya AI responses.
* **`test_safebox.py`**: Tests date normalization, DMS coordinate conversion, taxonomic species alignment, Excel parsing, and file upload API workflows.
* **`test_dna_matcher.py`**: Tests nucleotide subsequence matching, GC content computation, and migration predictor endpoints.
* **`test_ingestion.py`**: Tests Open-Meteo, AIS feed generation, eDNA Shannon index processing, and pipeline execution.
* **`test_database.py`**: Tests database table creation, record insertion, and query integrity.

---

## 🔄 End-to-End Backend Flow

```
1. TRIGGER / INGESTION
   ├── Scheduled Cron / User Trigger (/api/pipeline/run)
   ├── Live Map Click (/api/ocean/probe?lat=...&lon=...)
   └── File Drop to Safe Box (/api/safebox/upload)
               │
               ▼
2. NORMALIZATION & CLEANING (harmonizer.py)
   ├── Coordinates: "15° 15' N, 73° 40' E" ──► 15.250000, 73.666667
   ├── Dates: "15-Jun-2026" / Excel Serial ──► 2026-06-15T00:00:00Z
   └── Species: "yellowfin tuna" ────────────► "Thunnus albacares" (WoRMS)
               │
               ▼
3. SCIENTIFIC & AI ENRICHMENT
   ├── Mackenzie Formula ──► Acoustic Sound Speed (m/s)
   ├── Hobday (2016) ──────► Marine Heatwave Category (I to IV)
   ├── Random Forest ──────► PFZ Probability & Fishing Polygons
   ├── Shannon Diversity ──► Species Richness & Index (H')
   └── Google Gemini ──────► Telemetry-Grounded Matsya AI Insights
               │
               ▼
4. RELATIONAL PERSISTENCE (PostgreSQL / SQLite)
   ├── Atomic session commits across models.py
   └── PipelineLog audit entry generated
               │
               ▼
5. REAL-TIME CLIENT DISPATCH
   ├── WebSocket broadcast (/ws/live) pushes live markers to Leaflet map
   ├── SSE stream (/api/pipeline/stream) updates pipeline console
   └── REST response renders UI cards & interactive widgets
```

---

## 📡 API Endpoints Reference

### 1. System Health & Diagnostics
* **`GET /api/health`**
  * **Description**: Returns overall system operational status, database dialect in use, row counts for all tables, and details of the latest ETL pipeline execution.
  * **Request**: None.
  * **Response**:
    ```json
    {
      "status": "HEALTHY",
      "timestamp": "2026-09-12T14:04:16.840050Z",
      "database_dialect": "postgresql",
      "counts": {
        "ocean_observations": 301,
        "fisheries_records": 190,
        "edna_samples": 15,
        "pipeline_logs": 12
      },
      "latest_pipeline_run": {
        "id": 12,
        "timestamp": "2026-09-12T16:25:12.329221",
        "pipeline_name": "Unified-MultiDomain-ETL",
        "status": "SUCCESS",
        "records_processed": 52,
        "execution_time_ms": 89349.33
      }
    }
    ```

---

### 2. Physical Oceanography & CTD Soundings
* **`GET /api/ocean/live`**
  * **Description**: Returns the latest physical oceanography observations from global monitoring stations.
  * **Response**: List of observation objects containing station ID, temperature, salinity, wave height, currents, and coordinates.

* **`GET /api/ocean/probe`**
  * **Description**: Live digital CTD probe for any arbitrary coordinate on Earth. Queries Open-Meteo real-time APIs for live SST, wave height, and currents, and computes sound speed and species breakdown.
  * **Parameters**:
    * `lat` (float, required): Latitude between -90.0 and 90.0
    * `lon` (float, required): Longitude between -180.0 and 180.0
  * **Example Request**: `GET /api/ocean/probe?lat=41.0007&lon=-138.8170`
  * **Response**:
    ```json
    {
      "coordinates": { "latitude": 41.0007, "longitude": -138.817 },
      "basin": "North Pacific Ocean",
      "ocean_state": {
        "temperature_celsius": 13.6,
        "salinity_psu": 35.5,
        "wave_height_meters": 2.29,
        "wave_period_seconds": 7.5,
        "wave_direction_deg": 245,
        "current_velocity_ms": 0.65,
        "wind_speed_kmh": 14.5,
        "thermal_status": "Temperate Transition Zone",
        "source": "Open-Meteo Marine API (LIVE)",
        "is_live": true,
        "timestamp": "2026-09-12T14:15:30Z"
      },
      "fish_population": {
        "basin_name": "North Pacific Ocean",
        "density_category": "North Pacific Pelagic Basin",
        "school_presence_probability": 86,
        "optimal_fishing_depth": "20m - 65m",
        "species_likelihood": [
          { "species": "Pacific Bluefin Tuna", "likelihood": "High (82%)" },
          { "species": "Alaskan Pollock", "likelihood": "Moderate (50%)" },
          { "species": "Pacific Halibut", "likelihood": "High (76%)" }
        ]
      },
      "edna_history": {
        "nearby_samples_count": 3,
        "samples": [...]
      }
    }
    ```

* **`GET /api/ocean/depth-profile`**
  * **Description**: Returns calibrated vertical CTD depth profile (0m to 500m) for a given station.
  * **Parameters**: `station_id` (string, default: `"ST_MUMBAI"`)

---

### 3. Fisheries & Potential Fishing Zones
* **`GET /api/fisheries/vessels`**
  * **Description**: Returns live vessel AIS telemetry, gear types, targeted species, and catch weights.

* **`GET /api/fisheries/pfz`**
  * **Description**: Returns machine-learning generated Potential Fishing Zones (PFZ) with bounding polygons, target species, optimal sea conditions, and confidence scores.

---

### 4. Marine Genomics & DNA Matching
* **`POST /api/ai/dna-match`**
  * **Description**: Matches a raw nucleotide sequence against cataloged marine reference genomes.
  * **Request Body**:
    ```json
    {
      "sequence": "ATGGCTCATCAAGCACATAGATACATAGGCAAC..."
    }
    ```
  * **Response**:
    ```json
    {
      "match_found": true,
      "species_name": "Yellowfin Tuna",
      "scientific_name": "Thunnus albacares",
      "confidence_score": 98.4,
      "taxonomy": {
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "family": "Scombridae",
        "genus": "Thunnus"
      },
      "iucn_red_list_status": "Near Threatened",
      "habitat_depth": "0 - 250m Epipelagic",
      "gc_content_pct": 52.3
    }
    ```

* **`GET /api/ai/dna-samples`**
  * **Description**: Returns pre-configured reference DNA sequences for 1-click UI testing.

* **`GET /api/ai/fish-migration`**
  * **Description**: Returns a 7-day pelagic fish migration forecast driving school movements using thermal advection.

---

### 5. The Safe Box (Data Harmonizer & Upload)
* **`POST /api/safebox/upload`**
  * **Description**: Accepts multipart file upload (`.csv`, `.xlsx`, `.xls`, `.json`, `.fasta`). Automatically harmonizes coordinates, dates, and species names, and writes clean rows directly to PostgreSQL.
  * **Request**: Multipart Form Data with `file`.
  * **Response**:
    ```json
    {
      "status": "SUCCESS",
      "filename": "sample_fisheries_catch.csv",
      "detected_category": "FISHERIES",
      "cleaning_stats": {
        "original_rows": 4,
        "dates_standardized": 4,
        "locations_fixed": 2,
        "species_names_normalized": 4,
        "clean_rows": 4
      },
      "records_saved_to_db": 4,
      "preview": [
        {
          "date": "2026-06-10T00:00:00+00:00",
          "vessel_id": "IND-GOA-102",
          "vessel_name": "Sea Explorer",
          "latitude": 15.25,
          "longitude": 73.666667,
          "target_fish": "Thunnus albacares",
          "catch_kg": 480.5
        }
      ]
    }
    ```

---

### 6. Matsya AI Copilot
* **`POST /api/ai/chat`**
  * **Description**: Conversational marine intelligence interface grounded in live platform telemetry.
  * **Request Body**:
    ```json
    {
      "query": "Where are the high-confidence tuna hotspots right now?",
      "context": { "optional_custom_data": true }
    }
    ```
  * **Response**:
    ```json
    {
      "query": "Where are the high-confidence tuna hotspots right now?",
      "response": "### Potential Fishing Zone Advisory\nBased on live satellite sea surface temperatures...",
      "category": "GEMINI_REALTIME_LLM",
      "model": "gemini-flash-lite-latest",
      "suggested_actions": [
        "View Goa Basin SST gradients",
        "Check fleet coordinates near Lakshadweep"
      ]
    }
    ```

---

### 7. Pipeline Orchestration & Streaming
* **`POST /api/pipeline/run`**: Manually triggers the multi-domain ETL pipeline.
* **`GET /api/pipeline/stream`**: Server-Sent Events (SSE) streaming live logs, progress percentages, and record counters.
* **`GET /api/pipeline/logs`**: Retrieves the history of previous pipeline execution logs.
* **`WebSocket /ws/live`**: Full-duplex WebSocket broadcasting real-time vessel positions, buoy updates, and environmental metrics every 3 seconds.

---

## 🖥️ Frontend Architecture & User Interface

The frontend is built using standard **Vanilla HTML5, Modern CSS3, and ES6+ JavaScript** without bulky JavaScript framework overhead. This ensures instant load times, 60 FPS smooth map pan/zoom, and complete styling flexibility:

1. **Leaflet GIS Map Surface (`#oceanMap`)**:
   * Multi-layer capability: toggles between **Esri World Satellite Imagery**, **OpenSeaMap Navigational Seamarks**, and **CartoDB Dark Matter**.
   * Interactive markers: Custom pulsing SVG buoys for physical stations, directed boat glyphs for AIS vessels, and polygonal semi-transparent overlays for Potential Fishing Zones.
2. **Global Telemetry Ribbon (`.telemetry-ticker`)**:
   * Top bar streaming live global metrics: Global Mean SST, Active Fishing Fleets, Cataloged eDNA Barcodes, and live Zulu chronometer (`UTC`).
3. **Control HUD (`.console-controls`)**:
   * Quick-launch buttons for **The Safe Box**, **DNA Scanner**, **Run Pipeline**, and **Matsya AI**.
4. **CTD Sounding & Ocean Inspector Window (`#oceanProbeCard`)**:
   * A floating, draggable (`⠿`), stretchable, and resizable card.
   * Displays coordinates in both Decimal Degrees and DMS format, classified water mass, SST, salinity, wave height ($H_s$), sound speed, thermocline gradient, ocean current velocity, wind speed, species likelihoods, and nearby eDNA occurrences.
5. **The Safe Box Modal (`#safeBoxModal`)**:
   * Drag-and-drop zone for immediate upload and instant cleaning preview.
   * Visual chip selector with pre-loaded sample files (`Catch Log`, `Messy Buoy Coords`).
6. **DNA Sequence Scanner Modal (`#dnaModal`)**:
   * Interactive sequence input with 1-click test sequence chips for Yellowfin Tuna, Atlantic Bluefin, Whale Shark, Green Turtle, and Indian Mackerel.
7. **Matsya AI Slide-Over Drawer (`#chatDrawer`)**:
   * Cyberpunk/deep ocean styled conversational sidebar.
   * Features quick prompt suggestion chips, live generation stopwatch timer (`⏱ 0.8s`), 5-stage pipeline telemetry trace accordion, and dynamic follow-up chips.

---

## 🎓 The Master Study Plan (Recommended Learning Order)

To understand this platform deeply from architecture to code, follow this 8-step curriculum:

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ STEP 1  │ ──► │ STEP 2  │ ──► │ STEP 3  │ ──► │ STEP 4  │
│ Models  │     │ Ingest  │     │ SafeBox │     │ Models  │
│ & DB    │     │ & APIs  │     │ Clean   │     │ & ML    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │
     ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ STEP 5  │ ──► │ STEP 6  │ ──► │ STEP 7  │ ──► │ STEP 8  │
│ API &   │     │ Realtime│     │ Front   │     │ Tests & │
│ Routes  │     │ Sockets │     │ Leaflet │     │ Deploy  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### Step 1: Foundation & Data Architecture
* **Goal**: Understand how oceanography, fisheries, and genomics are modeled relationally.
* **Files to read**:
  1. [src/database/models.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/database/models.py)
  2. [src/database/connection.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/database/connection.py)
* **Key Concept**: Learn how `OceanObservation`, `FisheriesRecord`, and `EDNASample` map diverse scientific formats into unified database columns.

### Step 2: Ingestion & External Connectors
* **Goal**: Understand how data enters the platform from satellite APIs, buoys, and AIS streams.
* **Files to read**:
  1. [src/ingestion/ocean_realtime.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ingestion/ocean_realtime.py)
  2. [src/ingestion/fisheries_stream.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ingestion/fisheries_stream.py)
  3. [src/ingestion/edna_molecular.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ingestion/edna_molecular.py)
  4. [src/ingestion/obis_biodiversity.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ingestion/obis_biodiversity.py)
* **Key Concept**: Learn the dual-source fetching logic (Open-Meteo Marine + Forecast APIs) and how biodiversity feeds are retrieved.

### Step 3: Data Harmonization & The Safe Box
* **Goal**: Master data cleaning, geocoding conversions, and taxonomic resolution.
* **Files to read**:
  1. [src/cleaning/harmonizer.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/cleaning/harmonizer.py)
  2. [data/raw/sample_fisheries_catch.csv](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/data/raw/sample_fisheries_catch.csv)
  3. [tests/test_safebox.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/tests/test_safebox.py)
* **Key Concept**: Study regular expressions for DMS coordinate parsing (`parse_coordinate_string`) and fuzzy species name normalization.

### Step 4: AI Algorithms & Domain Physics
* **Goal**: Understand the scientific formulas and machine learning models.
* **Files to read**:
  1. [src/ai/dna_matcher.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ai/dna_matcher.py)
  2. [src/ai/pfz_predictor.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ai/pfz_predictor.py)
  3. [src/ai/marine_heatwave.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ai/marine_heatwave.py)
  4. [src/ai/copilot.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/ai/copilot.py)
* **Key Concept**: Trace the Mackenzie acoustic sound speed equation, Shannon-Wiener entropy formula $H' = -\sum p_i \ln p_i$, and Gemini LLM prompt construction.

### Step 5: Backend Application Routing
* **Goal**: Learn how the API connects the computational models to the web.
* **Files to read**:
  1. [src/api/main.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/api/main.py)
* **Key Concept**: Understand FastAPI decorators, query validation (`Query(...)`), multipart upload handling (`UploadFile`), and exception handling.

### Step 6: Real-Time Telemetry & Pipelines
* **Goal**: Understand streaming data architectures.
* **Files to read**:
  1. [src/pipeline/orchestrator.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/pipeline/orchestrator.py)
  2. The `/ws/live` handler in [src/api/main.py](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/api/main.py)
* **Key Concept**: Compare WebSockets (bidirectional live updates) with Server-Sent Events (SSE for unidirectional pipeline progress logs).

### Step 7: Frontend GIS & Interactive UI
* **Goal**: Understand how high-density scientific interfaces are created without heavy frameworks.
* **Files to read**:
  1. [src/static/index.html](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/static/index.html)
  2. [src/static/css/styles.css](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/static/css/styles.css)
  3. [src/static/js/app.js](file:///c:/Users/sarth/OneDrive/Desktop/marine-data-platform/src/static/js/app.js)
* **Key Concept**: Trace `inspectOceanPatch()`, draggable window mathematics (`setupDraggableInspector()`), and asynchronous chat message rendering.

### Step 8: Verification & Automated Testing
* **Goal**: Run and extend the test suite to guarantee regression-free engineering.
* **Files to run & inspect**:
  1. `tests/test_api.py`
  2. `tests/test_safebox.py`
  3. `tests/test_ai_models.py`
  4. `tests/test_dna_matcher.py`
* **Command**: `.\venv\Scripts\python -m pytest tests/ -v`

---

## 🚀 How to Run Locally

### 1. Requirements
* Python 3.10+ (tested on Python 3.13)
* Google Gemini API Key (optional, for real-time LLM chat; falls back to domain heuristics if not present)

### 2. Environment Setup
```bash
# Clone or navigate to the repository
cd marine-data-platform

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install project dependencies
pip install -r requirements.txt
```

### 3. Launching the Platform
```bash
# Start FastAPI backend server with hot-reloading
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser and navigate to: **`http://127.0.0.1:8000/`**

### 4. Running the Test Suite
```bash
pytest tests/ -v
```

---

## 🔮 Future Extensions & Roadmap
1. **Satellite GeoTIFF Ingestion**: Integrate Sentinel-3 OLCI and MODIS ocean color GeoTIFF rasters directly into Leaflet via WebGL shaders.
2. **Acoustic Passive Monitoring**: Ingest hydrophone audio spectrograms to detect cetacean vocalizations and shipping noise levels.
3. **Autonomous Surface Vehicle (ASV) Integration**: Ingest real-time telemetry from Saildrone and Wave Glider autonomous ocean drones.
4. **Vessel Track Reconstruction**: Train LSTM neural networks on historical AIS pings to predict illegal, unreported, and unregulated (IUU) fishing routes.
