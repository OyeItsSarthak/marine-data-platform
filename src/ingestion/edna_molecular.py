import math
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

# Standard marine eDNA sampling stations corresponding to oceanographic transects
EDNA_SAMPLING_STATIONS = [
    {
        "station_id": "ST_MUMBAI",
        "sample_id": "EDNA-2026-MUM-01",
        "lat": 18.92,
        "lon": 72.83,
        "depth": 10.0,
        "marker": "12S rRNA (MiFish)",
        "taxa": [
            {"species": "Rastrelliger kanagurta", "common_name": "Indian Mackerel", "reads": 14200, "status": "Least Concern"},
            {"species": "Sardinella longiceps", "common_name": "Indian Oil Sardine", "reads": 11800, "status": "Least Concern"},
            {"species": "Tenualosa ilisha", "common_name": "Hilsa Shad", "reads": 4500, "status": "Least Concern"},
            {"species": "Rhincodon typus", "common_name": "Whale Shark", "reads": 180, "status": "Endangered (IUCN Red List)"},
            {"species": "Thunnus albacares", "common_name": "Yellowfin Tuna", "reads": 3200, "status": "Near Threatened"}
        ]
    },
    {
        "station_id": "ST_GOA",
        "sample_id": "EDNA-2026-GOA-02",
        "lat": 15.49,
        "lon": 73.82,
        "depth": 15.0,
        "marker": "COI (Invertebrates)",
        "taxa": [
            {"species": "Penaeus monodon", "common_name": "Giant Tiger Prawn", "reads": 18400, "status": "Commercial"},
            {"species": "Portunus pelagicus", "common_name": "Blue Swimmer Crab", "reads": 9600, "status": "Commercial"},
            {"species": "Sepioteuthis lessoniana", "common_name": "Bigfin Reef Squid", "reads": 6100, "status": "Commercial"},
            {"species": "Acropora cervicornis", "common_name": "Staghorn Coral", "reads": 890, "status": "Critically Endangered"}
        ]
    },
    {
        "station_id": "ST_KOCHI",
        "sample_id": "EDNA-2026-KOC-03",
        "lat": 9.93,
        "lon": 76.26,
        "depth": 25.0,
        "marker": "12S rRNA (MiFish)",
        "taxa": [
            {"species": "Epinephelus coioides", "common_name": "Orange-spotted Grouper", "reads": 8200, "status": "Near Threatened"},
            {"species": "Lates calcarifer", "common_name": "Barramundi / Asian Seabass", "reads": 12500, "status": "Commercial"},
            {"species": "Carcharhinus falciformis", "common_name": "Silky Shark", "reads": 340, "status": "Vulnerable (IUCN Red List)"},
            {"species": "Sphyraena barracuda", "common_name": "Great Barracuda", "reads": 4900, "status": "Least Concern"}
        ]
    },
    {
        "station_id": "ST_CHENNAI",
        "sample_id": "EDNA-2026-CHE-04",
        "lat": 13.08,
        "lon": 80.27,
        "depth": 20.0,
        "marker": "12S rRNA (MiFish)",
        "taxa": [
            {"species": "Katsuwonus pelamis", "common_name": "Skipjack Tuna", "reads": 16700, "status": "Least Concern"},
            {"species": "Coryphaena hippurus", "common_name": "Mahi Mahi / Dolphinfish", "reads": 7800, "status": "Least Concern"},
            {"species": "Dugong dugon", "common_name": "Dugong / Sea Cow", "reads": 120, "status": "Vulnerable (IUCN Red List)"},
            {"species": "Chanos chanos", "common_name": "Milkfish", "reads": 9100, "status": "Least Concern"}
        ]
    },
    {
        "station_id": "ST_LAKSHADWEEP",
        "sample_id": "EDNA-2026-LAK-05",
        "lat": 10.56,
        "lon": 72.64,
        "depth": 5.0,
        "marker": "COI & 18S (Reef Metagenomics)",
        "taxa": [
            {"species": "Chelonia mydas", "common_name": "Green Sea Turtle", "reads": 420, "status": "Endangered (IUCN Red List)"},
            {"species": "Pocillopora damicornis", "common_name": "Lace Coral", "reads": 21300, "status": "Least Concern"},
            {"species": "Tridacna gigas", "common_name": "Giant Clam", "reads": 1150, "status": "Vulnerable"},
            {"species": "Chaetodon auriga", "common_name": "Threadfin Butterflyfish", "reads": 14200, "status": "Least Concern"}
        ]
    },
    {
        "station_id": "ST_GBR",
        "sample_id": "EDNA-2026-GBR-06",
        "lat": -16.80,
        "lon": 146.20,
        "depth": 8.0,
        "marker": "12S & COI (Coral Reef)",
        "taxa": [
            {"species": "Plectropomus leopardus", "common_name": "Coral Trout", "reads": 15800, "status": "Least Concern"},
            {"species": "Carcharhinus melanopterus", "common_name": "Blacktip Reef Shark", "reads": 680, "status": "Vulnerable (IUCN Red List)"},
            {"species": "Acropora millepora", "common_name": "Staghorn Coral", "reads": 28400, "status": "Near Threatened"},
            {"species": "Hippocampus bargibanti", "common_name": "Pygmy Seahorse", "reads": 310, "status": "Data Deficient"}
        ]
    },
    {
        "station_id": "ST_MONTEREY",
        "sample_id": "EDNA-2026-MBNMS-07",
        "lat": 36.75,
        "lon": -122.00,
        "depth": 18.0,
        "marker": "12S rRNA (Kelp Forest)",
        "taxa": [
            {"species": "Macrocystis pyrifera", "common_name": "Giant Kelp", "reads": 42100, "status": "Foundation Species"},
            {"species": "Enhydra lutris", "common_name": "Southern Sea Otter", "reads": 890, "status": "Endangered (IUCN Red List)"},
            {"species": "Balaenoptera musculus", "common_name": "Blue Whale", "reads": 340, "status": "Endangered (IUCN Red List)"},
            {"species": "Sebastes mystinus", "common_name": "Blue Rockfish", "reads": 12400, "status": "Least Concern"}
        ]
    },
    {
        "station_id": "ST_GALAPAGOS",
        "sample_id": "EDNA-2026-GAL-08",
        "lat": -0.50,
        "lon": -90.50,
        "depth": 12.0,
        "marker": "12S & COI (Pelagic Apex)",
        "taxa": [
            {"species": "Sphyrna lewini", "common_name": "Scalloped Hammerhead Shark", "reads": 780, "status": "Critically Endangered (IUCN)"},
            {"species": "Amblyrhynchus cristatus", "common_name": "Marine Iguana", "reads": 450, "status": "Vulnerable (IUCN Red List)"},
            {"species": "Thunnus albacares", "common_name": "Yellowfin Tuna", "reads": 9600, "status": "Near Threatened"},
            {"species": "Spheniscus mendiculus", "common_name": "Galápagos Penguin", "reads": 290, "status": "Endangered (IUCN Red List)"}
        ]
    },
    {
        "station_id": "ST_BERMUDA",
        "sample_id": "EDNA-2026-SARG-09",
        "lat": 31.67,
        "lon": -64.17,
        "depth": 35.0,
        "marker": "12S (Sargasso Sea Open Gyre)",
        "taxa": [
            {"species": "Anguilla anguilla", "common_name": "European Eel (Leptocephali)", "reads": 520, "status": "Critically Endangered (IUCN)"},
            {"species": "Histrio histrio", "common_name": "Sargassum Fish", "reads": 6300, "status": "Least Concern"},
            {"species": "Thunnus thynnus", "common_name": "Atlantic Bluefin Tuna", "reads": 2100, "status": "Endangered (IUCN Red List)"},
            {"species": "Kajikia albida", "common_name": "White Marlin", "reads": 740, "status": "Vulnerable"}
        ]
    },
    {
        "station_id": "ST_SVALBARD",
        "sample_id": "EDNA-2026-ARCTIC-10",
        "lat": 78.90,
        "lon": 11.90,
        "depth": 40.0,
        "marker": "12S rRNA (Arctic Pelagic)",
        "taxa": [
            {"species": "Boreogadus saida", "common_name": "Polar Cod", "reads": 19200, "status": "Least Concern"},
            {"species": "Somniosus microcephalus", "common_name": "Greenland Shark", "reads": 190, "status": "Vulnerable (IUCN Red List)"},
            {"species": "Delphinapterus leucas", "common_name": "Beluga Whale", "reads": 410, "status": "Near Threatened"},
            {"species": "Calanus glacialis", "common_name": "Arctic Copepod", "reads": 34000, "status": "Keystone Forage"}
        ]
    },
    {
        "station_id": "ST_DRAKE",
        "sample_id": "EDNA-2026-ANT-11",
        "lat": -58.50,
        "lon": -63.00,
        "depth": 50.0,
        "marker": "18S & COI (Southern Ocean)",
        "taxa": [
            {"species": "Euphausia superba", "common_name": "Antarctic Krill", "reads": 68000, "status": "Keystone Biomass"},
            {"species": "Dissostichus eleginoides", "common_name": "Patagonian Toothfish", "reads": 3400, "status": "Commercial Managed"},
            {"species": "Pygoscelis adeliae", "common_name": "Adélie Penguin", "reads": 890, "status": "Least Concern"},
            {"species": "Balaenoptera physalus", "common_name": "Fin Whale", "reads": 320, "status": "Vulnerable (IUCN Red List)"}
        ]
    },
    {
        "station_id": "ST_MED_BALEARIC",
        "sample_id": "EDNA-2026-MED-12",
        "lat": 39.50,
        "lon": 2.50,
        "depth": 22.0,
        "marker": "12S rRNA (Mediterranean)",
        "taxa": [
            {"species": "Thunnus thynnus", "common_name": "Mediterranean Bluefin Tuna", "reads": 8400, "status": "Endangered (IUCN Red List)"},
            {"species": "Monachus monachus", "common_name": "Mediterranean Monk Seal", "reads": 110, "status": "Endangered (IUCN Red List)"},
            {"species": "Posidonia oceanica", "common_name": "Neptune Grass Seagrass", "reads": 24500, "status": "Priority Habitat"},
            {"species": "Stenella coeruleoalba", "common_name": "Striped Dolphin", "reads": 780, "status": "Least Concern"}
        ]
    }
]

def calculate_shannon_index(taxa_reads: List[int]) -> float:
    """
    Shannon-Wiener Diversity Index: H' = -sum(p_i * ln(p_i))
    Higher values indicate greater biodiversity and ecosystem resilience.
    """
    total = sum(taxa_reads)
    if total == 0:
        return 0.0
    h_prime = 0.0
    for reads in taxa_reads:
        if reads > 0:
            p = reads / total
            h_prime -= p * math.log(p)
    return round(h_prime, 3)

def calculate_simpson_index(taxa_reads: List[int]) -> float:
    """
    Gini-Simpson Diversity Index: 1 - sum(p_i^2)
    Ranges from 0 (monoculture) to 1 (infinite diversity).
    """
    total = sum(taxa_reads)
    if total == 0:
        return 0.0
    sum_p_squared = sum((reads / total) ** 2 for reads in taxa_reads)
    return round(1.0 - sum_p_squared, 3)

def load_edna_samples() -> List[Dict[str, Any]]:
    """
    Process raw eDNA metabarcoding datasets into standardized molecular records
    with computed biodiversity indices and red-list alerts.
    """
    now = datetime.now(timezone.utc)
    records = []

    for station in EDNA_SAMPLING_STATIONS:
        taxa = station["taxa"]
        reads_list = [t["reads"] for t in taxa]
        total_reads = sum(reads_list)
        shannon = calculate_shannon_index(reads_list)
        simpson = calculate_simpson_index(reads_list)

        endangered = [
            t for t in taxa
            if any(term in t.get("status", "") for term in ["Endangered", "Vulnerable", "Critically"])
        ]

        record = {
            "sample_id": station["sample_id"],
            "station_id": station["station_id"],
            "timestamp": now.isoformat(),
            "latitude": station["lat"],
            "longitude": station["lon"],
            "depth": station["depth"],
            "marker_gene": station["marker"],
            "shannon_index": shannon,
            "simpson_index": simpson,
            "species_richness": len(taxa),
            "detected_taxa": taxa,
            "endangered_taxa": endangered,
            "raw_reads": total_reads
        }
        records.append(record)

    return records

if __name__ == "__main__":
    samples = load_edna_samples()
    print(f"Processed {len(samples)} eDNA molecular samples:")
    for s in samples[:2]:
        print(f"Station {s['station_id']}: Shannon={s['shannon_index']}, Richness={s['species_richness']}, Reads={s['raw_reads']}")
