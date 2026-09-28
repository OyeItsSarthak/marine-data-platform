import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import RandomForestClassifier

class PFZPredictor:
    """
    AI Potential Fishing Zone (PFZ) Predictor.
    Combines physical oceanography (SST fronts, current shear) and biological proxies
    (chlorophyll-a, dissolved oxygen) to predict pelagic fish aggregation zones.
    """
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=30, random_state=42)
        self._train_baseline_model()

    def _train_baseline_model(self):
        # Synthetic domain-calibrated training dataset based on tropical oceanographic PFZ surveys
        # Features: [sst, sst_gradient, chlorophyll, salinity, current_velocity, depth]
        X = [
            # High yield upwelling zones (cold-front boundary, high chlorophyll, moderate current)
            [28.1, 0.65, 2.4, 35.1, 0.8, 45.0],
            [27.9, 0.72, 3.1, 35.3, 0.9, 60.0],
            [28.3, 0.58, 1.8, 34.9, 0.7, 50.0],
            [27.5, 0.80, 3.8, 35.4, 1.1, 75.0],
            [28.6, 0.45, 1.6, 34.8, 0.6, 30.0],
            [28.0, 0.60, 2.2, 35.0, 0.75, 55.0],

            # Moderate zones
            [29.0, 0.35, 0.9, 34.5, 0.5, 90.0],
            [29.2, 0.30, 0.8, 34.2, 0.4, 110.0],
            [28.8, 0.40, 1.1, 34.7, 0.6, 40.0],
            [29.4, 0.28, 0.7, 34.0, 0.45, 80.0],

            # Low yield open ocean oligotrophic water (high SST, flat gradient, low chlorophyll)
            [30.5, 0.10, 0.15, 33.5, 0.2, 500.0],
            [30.8, 0.08, 0.12, 33.2, 0.15, 800.0],
            [31.0, 0.05, 0.10, 33.0, 0.25, 1200.0],
            [30.2, 0.12, 0.20, 33.8, 0.3, 350.0],
            [30.7, 0.09, 0.14, 33.4, 0.2, 650.0],
        ]
        # Labels: 2 = High PFZ, 1 = Moderate PFZ, 0 = Low/Unfavorable
        y = [2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0]
        self.model.fit(X, y)

    def predict_point(
        self,
        sst: float,
        sst_gradient: float,
        chlorophyll: float,
        salinity: float,
        current_velocity: float,
        depth: float
    ) -> Dict[str, Any]:
        features = np.array([[sst, sst_gradient, chlorophyll, salinity, current_velocity, depth]])
        probs = self.model.predict_proba(features)[0]
        # High PFZ probability
        high_prob = float(probs[2]) if len(probs) > 2 else float(probs[-1])
        score = round(high_prob * 100, 1)

        if score >= 70:
            category = "High Potential"
            target = "Yellowfin Tuna, Skipjack, Mackerel"
            depth_range = "15m - 45m"
            color = "#10b981"
        elif score >= 40:
            category = "Moderate Potential"
            target = "Sardine, Anchovy, Carangids"
            depth_range = "10m - 30m"
            color = "#f59e0b"
        else:
            category = "Low Potential"
            target = "Scattered Pelagics"
            depth_range = "Surface"
            color = "#64748b"

        return {
            "pfz_score": score,
            "category": category,
            "target_species": target,
            "optimal_depth": depth_range,
            "advisory_color": color,
            "confidence": round(float(np.max(probs)), 2)
        }

    def generate_regional_pfz_zones(self) -> List[Dict[str, Any]]:
        """
        Generate operational PFZ polygons with AI confidence metrics for the interactive map.
        """
        # Predefined oceanic front convergence zones across global fishing regions
        candidates = [
            # Indian Ocean
            {"id": "PFZ-AS-01", "name": "Konkan Thermal Front", "lat": 16.2, "lon": 72.3, "sst": 28.0, "grad": 0.68, "chl": 2.6, "sal": 35.2, "vel": 0.85, "depth": 55.0},
            {"id": "PFZ-AS-02", "name": "Malabar Upwelling Zone", "lat": 10.4, "lon": 75.5, "sst": 27.8, "grad": 0.75, "chl": 3.4, "sal": 35.4, "vel": 0.95, "depth": 65.0},
            {"id": "PFZ-BOB-03", "name": "Krishna-Godavari Plume Front", "lat": 16.8, "lon": 82.7, "sst": 28.5, "grad": 0.52, "chl": 1.9, "sal": 34.6, "vel": 0.65, "depth": 45.0},
            {"id": "PFZ-LK-04", "name": "Lakshadweep Chagos Ridge Eddy", "lat": 11.2, "lon": 72.2, "sst": 28.9, "grad": 0.42, "chl": 1.3, "sal": 35.0, "vel": 0.70, "depth": 85.0},

            # North & South Atlantic
            {"id": "PFZ-NATL-05", "name": "Grand Banks Cold-Warm Front", "lat": 43.8, "lon": -49.5, "sst": 14.5, "grad": 0.92, "chl": 3.8, "sal": 33.8, "vel": 0.95, "depth": 65.0},
            {"id": "PFZ-SATL-06", "name": "Benguela Current Upwelling", "lat": -25.5, "lon": 13.8, "sst": 15.5, "grad": 0.82, "chl": 4.1, "sal": 35.2, "vel": 0.75, "depth": 50.0},

            # Pacific Ocean
            {"id": "PFZ-NPAC-07", "name": "Kuroshio-Oyashio Pelagic Front", "lat": 37.5, "lon": 144.2, "sst": 18.2, "grad": 0.88, "chl": 3.2, "sal": 34.5, "vel": 1.10, "depth": 70.0},
            {"id": "PFZ-SPAC-08", "name": "Humboldt Upwelling Pelagic Zone", "lat": -14.2, "lon": -76.8, "sst": 16.8, "grad": 0.95, "chl": 4.8, "sal": 35.1, "vel": 0.80, "depth": 40.0},
            {"id": "PFZ-EPAC-09", "name": "Galápagos Equatorial Front", "lat": -0.8, "lon": -92.5, "sst": 22.4, "grad": 0.72, "chl": 2.8, "sal": 34.8, "vel": 0.85, "depth": 60.0},

            # Mediterranean
            {"id": "PFZ-MED-10", "name": "Balearic Thermal Front", "lat": 40.2, "lon": 3.8, "sst": 21.5, "grad": 0.65, "chl": 2.1, "sal": 37.8, "vel": 0.60, "depth": 50.0}
        ]

        zones = []
        for c in candidates:
            pred = self.predict_point(c["sst"], c["grad"], c["chl"], c["sal"], c["vel"], c["depth"])
            zones.append({
                "zone_id": c["id"],
                "zone_name": c["name"],
                "latitude": c["lat"],
                "longitude": c["lon"],
                "radius_km": 35,
                "sst": c["sst"],
                "chlorophyll_mg_m3": c["chl"],
                "pfz_score": pred["pfz_score"],
                "category": pred["category"],
                "target_species": pred["target_species"],
                "optimal_depth": pred["optimal_depth"],
                "color": pred["advisory_color"],
                "polygon": [
                    [c["lat"] - 0.25, c["lon"] - 0.25],
                    [c["lat"] + 0.25, c["lon"] - 0.25],
                    [c["lat"] + 0.25, c["lon"] + 0.25],
                    [c["lat"] - 0.25, c["lon"] + 0.25]
                ]
            })

        return zones

# Global instance
pfz_ai = PFZPredictor()

if __name__ == "__main__":
    test_pred = pfz_ai.predict_point(28.0, 0.7, 2.8, 35.2, 0.9, 50.0)
    print("PFZ Test Prediction:", test_pred)
    zones = pfz_ai.generate_regional_pfz_zones()
    print(f"Generated {len(zones)} regional PFZ zones.")
