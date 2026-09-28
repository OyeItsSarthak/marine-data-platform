import random
from datetime import datetime, timezone
from typing import List, Dict, Any

ACTIVE_VESSELS = [
    # --- Indian Ocean & Arabian Sea Fleet ---
    {"vessel_id": "IND-F-101", "vessel_name": "Matsya Sagar I", "gear_type": "Longliner", "target": "Yellowfin Tuna", "base_lat": 16.5, "base_lon": 72.1},
    {"vessel_id": "IND-F-102", "vessel_name": "Blue Fin Hunter", "gear_type": "Purse Seine", "target": "Indian Mackerel", "base_lat": 18.2, "base_lon": 72.4},
    {"vessel_id": "IND-F-103", "vessel_name": "Samudra Ratna", "gear_type": "Pelagic Trawler", "target": "Ribbonfish & Squids", "base_lat": 15.1, "base_lon": 73.5},
    {"vessel_id": "IND-F-104", "vessel_name": "Oceanic Pioneer", "gear_type": "Gillnet", "target": "Oil Sardine", "base_lat": 10.2, "base_lon": 75.8},
    {"vessel_id": "IND-F-105", "vessel_name": "Coromandel Voyager", "gear_type": "Trawler", "target": "Tiger Prawns", "base_lat": 13.2, "base_lon": 80.5},
    {"vessel_id": "IND-F-106", "vessel_name": "Kalinga Fisher IX", "gear_type": "Longliner", "target": "Skipjack Tuna", "base_lat": 17.4, "base_lon": 83.4},
    {"vessel_id": "IND-F-107", "vessel_name": "Nicobar Navigator", "gear_type": "Purse Seine", "target": "Snappers & Groupers", "base_lat": 11.8, "base_lon": 92.5},
    {"vessel_id": "IND-F-108", "vessel_name": "Malabar Pearl", "gear_type": "Gillnet", "target": "Mackerel", "base_lat": 11.2, "base_lon": 75.3},
    {"vessel_id": "SYC-F-109", "vessel_name": "Seychelles Star", "gear_type": "Tuna Longliner", "target": "Bigeye Tuna", "base_lat": -3.8, "base_lon": 56.1},

    # --- North & South Atlantic Fleet ---
    {"vessel_id": "CAN-F-201", "vessel_name": "Grand Banks Pioneer", "gear_type": "Demersal Trawler", "target": "Atlantic Cod & Haddock", "base_lat": 44.5, "base_lon": -50.2},
    {"vessel_id": "NOR-F-202", "vessel_name": "Nordic Storm", "gear_type": "Purse Seine", "target": "Atlantic Herring", "base_lat": 63.2, "base_lon": 4.8},
    {"vessel_id": "ESP-F-203", "vessel_name": "Atlántico Sur", "gear_type": "Pelagic Longliner", "target": "Swordfish & Blue Shark", "base_lat": 36.8, "base_lon": -24.5},
    {"vessel_id": "FLK-F-204", "vessel_name": "Falkland Explorer", "gear_type": "Squid Jigger", "target": "Illex Squid", "base_lat": -51.2, "base_lon": -58.6},
    {"vessel_id": "NAM-F-205", "vessel_name": "Benguela Star", "gear_type": "Deep Trawler", "target": "Cape Hake", "base_lat": -22.8, "base_lon": 14.1},

    # --- North, Central & South Pacific Fleet ---
    {"vessel_id": "USA-F-301", "vessel_name": "Bering Sea Titan", "gear_type": "Factory Trawler", "target": "Alaskan Pollock", "base_lat": 56.4, "base_lon": -166.5},
    {"vessel_id": "USA-F-302", "vessel_name": "Oceanic Wanderer", "gear_type": "Pelagic Longliner", "target": "Pacific Bigeye Tuna", "base_lat": 20.8, "base_lon": -156.2},
    {"vessel_id": "JPN-F-303", "vessel_name": "Kuroshio Maru", "gear_type": "Tuna Longliner", "target": "Pacific Bluefin Tuna", "base_lat": 33.8, "base_lon": 139.2},
    {"vessel_id": "ECU-F-304", "vessel_name": "Galápagos Voyager", "gear_type": "Purse Seine", "target": "Yellowfin Tuna", "base_lat": -1.2, "base_lon": -91.8},
    {"vessel_id": "CHL-F-305", "vessel_name": "Humboldt Ranger", "gear_type": "Purse Seine", "target": "Chilean Jack Mackerel", "base_lat": -35.2, "base_lon": -74.1},
    {"vessel_id": "AUS-F-306", "vessel_name": "Coral Sea Navigator", "gear_type": "Longliner", "target": "Albacoare & Mahi Mahi", "base_lat": -18.2, "base_lon": 148.5},
    {"vessel_id": "NZL-F-307", "vessel_name": "Southern Cross", "gear_type": "Midwater Trawler", "target": "Hoki & Squid", "base_lat": -42.8, "base_lon": 172.4},

    # --- Mediterranean Fleet ---
    {"vessel_id": "ITA-F-401", "vessel_name": "Stella Maris", "gear_type": "Purse Seine", "target": "Mediterranean Bluefin Tuna", "base_lat": 38.2, "base_lon": 12.8}
]

def generate_live_fisheries_feed() -> List[Dict[str, Any]]:
    """
    Generate real-time simulated AIS fisheries telemetry and catch events
    matching real fishing fleet behaviors across global ocean fishing zones.
    """
    now = datetime.now(timezone.utc)
    records = []

    for v in ACTIVE_VESSELS:
        # Micro-drift simulating real nautical movement
        lat_offset = random.uniform(-0.08, 0.08)
        lon_offset = random.uniform(-0.08, 0.08)
        speed = round(random.uniform(2.5, 9.8), 1)
        status = "Active Fishing" if speed < 4.5 else "Steaming to Fishing Ground"

        # Catch estimation based on gear and operation
        catch_kg = round(random.uniform(150.0, 1850.0), 1) if status == "Active Fishing" else round(random.uniform(50.0, 400.0), 1)
        effort_hours = round(random.uniform(2.0, 14.0), 1)

        # High alignment with thermal fronts yields higher catch
        pfz_score = round(random.uniform(65.0, 98.0), 1)

        records.append({
            "vessel_id": v["vessel_id"],
            "vessel_name": v["vessel_name"],
            "timestamp": now.isoformat(),
            "latitude": round(v["base_lat"] + lat_offset, 4),
            "longitude": round(v["base_lon"] + lon_offset, 4),
            "speed_knots": speed,
            "heading_degrees": random.randint(0, 359),
            "gear_type": v["gear_type"],
            "species_targeted": v["target"],
            "catch_weight_kg": catch_kg,
            "effort_hours": effort_hours,
            "cpue": round(catch_kg / max(effort_hours, 1.0), 2), # Catch Per Unit Effort
            "status": status,
            "pfz_score": pfz_score
        })

    return records

if __name__ == "__main__":
    feed = generate_live_fisheries_feed()
    print(f"Generated {len(feed)} live vessel telemetry records:")
    print(feed[0])
