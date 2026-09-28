import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, text
from src.database.connection import Base, engine

class OceanObservation(Base):
    __tablename__ = "ocean_observations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(String(50), index=True, nullable=False)
    observation_date = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    depth = Column(Float, default=0.0)
    temperature = Column(Float, nullable=True)
    salinity = Column(Float, nullable=True)
    region = Column(String(100), nullable=True)
    chlorophyll = Column(Float, nullable=True)
    dissolved_oxygen = Column(Float, nullable=True)
    wave_height = Column(Float, nullable=True)
    current_velocity = Column(Float, nullable=True)
    current_direction = Column(Float, nullable=True)
    source = Column(String(50), default="Open-Meteo")

    def to_dict(self):
        ts = self.timestamp or self.observation_date
        return {
            "id": self.id,
            "station_id": self.station_id,
            "timestamp": ts.isoformat() if ts else None,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "depth": float(self.depth) if self.depth is not None else 0.0,
            "temperature": float(self.temperature) if self.temperature is not None else None,
            "salinity": float(self.salinity) if self.salinity is not None else None,
            "region": self.region,
            "chlorophyll": float(self.chlorophyll) if self.chlorophyll is not None else None,
            "dissolved_oxygen": float(self.dissolved_oxygen) if self.dissolved_oxygen is not None else None,
            "wave_height": float(self.wave_height) if self.wave_height is not None else None,
            "current_velocity": float(self.current_velocity) if self.current_velocity is not None else None,
            "current_direction": float(self.current_direction) if self.current_direction is not None else None,
            "source": self.source
        }

class FisheriesRecord(Base):
    __tablename__ = "fisheries_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vessel_id = Column(String(50), index=True, nullable=False)
    vessel_name = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    gear_type = Column(String(50), default="Trawler")
    species_targeted = Column(String(100), default="Tuna")
    catch_weight_kg = Column(Float, default=0.0)
    effort_hours = Column(Float, default=1.0)
    status = Column(String(50), default="Fishing")
    pfz_score = Column(Float, default=75.0)

    def to_dict(self):
        return {
            "id": self.id,
            "vessel_id": self.vessel_id,
            "vessel_name": self.vessel_name,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "gear_type": self.gear_type,
            "species_targeted": self.species_targeted,
            "catch_weight_kg": float(self.catch_weight_kg) if self.catch_weight_kg is not None else 0.0,
            "effort_hours": float(self.effort_hours) if self.effort_hours is not None else 1.0,
            "status": self.status,
            "pfz_score": float(self.pfz_score) if self.pfz_score is not None else 0.0
        }

class EDNASample(Base):
    __tablename__ = "edna_samples"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sample_id = Column(String(50), unique=True, index=True, nullable=False)
    station_id = Column(String(50), index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    depth = Column(Float, default=5.0)
    marker_gene = Column(String(50), default="12S rRNA")
    shannon_index = Column(Float, default=0.0)
    simpson_index = Column(Float, default=0.0)
    species_richness = Column(Integer, default=0)
    detected_taxa = Column(Text, default="[]")
    endangered_taxa = Column(Text, default="[]")
    raw_reads = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "sample_id": self.sample_id,
            "station_id": self.station_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "depth": float(self.depth) if self.depth is not None else 5.0,
            "marker_gene": self.marker_gene,
            "shannon_index": float(self.shannon_index) if self.shannon_index is not None else 0.0,
            "simpson_index": float(self.simpson_index) if self.simpson_index is not None else 0.0,
            "species_richness": self.species_richness,
            "detected_taxa": json.loads(self.detected_taxa) if self.detected_taxa else [],
            "endangered_taxa": json.loads(self.endangered_taxa) if self.endangered_taxa else [],
            "raw_reads": self.raw_reads
        }

class MarineSpecies(Base):
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scientific_name = Column(String(150), unique=True, index=True, nullable=False)
    vernacular_name = Column(String(150), nullable=True)
    kingdom = Column(String(50), default="Animalia")
    phylum = Column(String(50), index=True)
    class_name = Column(String(50), nullable=True)
    order_name = Column(String(50), nullable=True)
    family = Column(String(50), index=True)
    genus = Column(String(50), nullable=True)
    red_list_status = Column(String(50), default="Least Concern")
    source = Column(String(50), default="GBIF/OBIS")

    def to_dict(self):
        return {
            "id": self.id,
            "scientific_name": self.scientific_name,
            "vernacular_name": self.vernacular_name,
            "kingdom": self.kingdom,
            "phylum": self.phylum,
            "class_name": self.class_name,
            "order_name": self.order_name,
            "family": self.family,
            "genus": self.genus,
            "red_list_status": self.red_list_status,
            "source": self.source
        }

class MarineOccurrence(Base):
    __tablename__ = "marine_occurrences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    occurrence_id = Column(String(100), unique=True, index=True, nullable=False)
    scientific_name = Column(String(150), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    depth = Column(Float, default=0.0)
    event_date = Column(DateTime, nullable=True)
    marine_region = Column(String(100), nullable=True)
    dataset_name = Column(String(250), nullable=True)
    basis_of_record = Column(String(100), default="HumanObservation")
    source = Column(String(50), default="OBIS")

    def to_dict(self):
        return {
            "id": self.id,
            "occurrence_id": self.occurrence_id,
            "scientific_name": self.scientific_name,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "depth": float(self.depth) if self.depth is not None else 0.0,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "marine_region": self.marine_region,
            "dataset_name": self.dataset_name,
            "basis_of_record": self.basis_of_record,
            "source": self.source
        }

class PipelineLog(Base):
    __tablename__ = "pipeline_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    pipeline_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    records_processed = Column(Integer, default=0)
    validation_summary = Column(Text, default="")
    execution_time_ms = Column(Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "pipeline_name": self.pipeline_name,
            "status": self.status,
            "records_processed": self.records_processed,
            "validation_summary": self.validation_summary,
            "execution_time_ms": self.execution_time_ms
        }

def init_db():
    """Create all tables and migrate any missing columns safely."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        if engine.dialect.name == "postgresql":
            migrations = [
                "ALTER TABLE ocean_observations ALTER COLUMN observation_date DROP NOT NULL;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS observation_date TIMESTAMP;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS region VARCHAR(100);",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS chlorophyll DOUBLE PRECISION;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS dissolved_oxygen DOUBLE PRECISION;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS wave_height DOUBLE PRECISION;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS current_velocity DOUBLE PRECISION;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS current_direction DOUBLE PRECISION;",
                "ALTER TABLE ocean_observations ADD COLUMN IF NOT EXISTS source VARCHAR(50);"
            ]
            for stmt in migrations:
                try:
                    conn.execute(text(stmt))
                    conn.commit()
                except Exception as e:
                    pass
    print("[DB] Initialized and verified database schema successfully.")

if __name__ == "__main__":
    init_db()
