from typing import Dict, Any, List

class MarineHeatwaveDetector:
    """
    Implements the Hobday et al. (2016) Marine Heatwave (MHW) detection framework
    and biological risk indices (thermal bleaching, hypoxia potential, pelagic displacement).
    """
    def __init__(self):
        # Climatological baseline 90th percentile thresholds for key marine sectors
        self.climatology_baselines = {
            "Arabian Sea (Eastern Basin)": {"mean_sst": 28.2, "threshold_p90": 29.5},
            "Bay of Bengal": {"mean_sst": 28.5, "threshold_p90": 29.8},
            "Lakshadweep Sea": {"mean_sst": 28.6, "threshold_p90": 29.7},
            "Andaman & Nicobar Waters": {"mean_sst": 28.4, "threshold_p90": 29.6},
            "Equatorial Indian Ocean": {"mean_sst": 28.8, "threshold_p90": 29.9}
        }

    def assess_thermal_stress(
        self,
        region: str,
        observed_sst: float,
        dissolved_oxygen: float = 5.0
    ) -> Dict[str, Any]:
        baseline = self.climatology_baselines.get(
            region,
            {"mean_sst": 28.3, "threshold_p90": 29.5}
        )

        mean_sst = baseline["mean_sst"]
        p90_threshold = baseline["threshold_p90"]
        sst_anomaly = round(observed_sst - mean_sst, 2)
        excess_heat = observed_sst - p90_threshold

        is_heatwave = excess_heat > 0
        intensity = round(excess_heat, 2) if is_heatwave else 0.0

        # Hobday Category Classification
        if not is_heatwave:
            category = "Normal Thermal State"
            alert_level = "GREEN"
            advisory = "Normal thermal conditions. No immediate stress on marine ecosystems."
        elif excess_heat < 0.5:
            category = "Category I (Moderate MHW)"
            alert_level = "YELLOW"
            advisory = "Mild thermal anomaly. Monitor coral reef health and shallow aquaculture."
        elif excess_heat < 1.2:
            category = "Category II (Strong MHW)"
            alert_level = "ORANGE"
            advisory = "Significant thermal stress. Elevated coral bleaching risk and pelagic fish migration into deeper/colder strata."
        elif excess_heat < 2.0:
            category = "Category III (Severe MHW)"
            alert_level = "RED"
            advisory = "Severe thermal crisis. High probability of mass coral bleaching and hypoxic dead zones."
        else:
            category = "Category IV (Extreme MHW)"
            alert_level = "CRITICAL_PURPLE"
            advisory = "Catastrophic thermal event. Severe marine fauna mortality and ecosystem collapse risk."

        # Hypoxia assessment: warm water holds less gas; if DO < 3.0 mg/L, acute hypoxia alert
        hypoxia_risk = "High Hypoxia Risk" if dissolved_oxygen < 3.5 and observed_sst > 29.5 else "Stable Oxygenation"

        return {
            "region": region,
            "observed_sst": observed_sst,
            "climatological_mean": mean_sst,
            "sst_anomaly": sst_anomaly,
            "is_heatwave": is_heatwave,
            "mhw_intensity_deg_c": intensity,
            "category": category,
            "alert_level": alert_level,
            "hypoxia_risk": hypoxia_risk,
            "advisory": advisory
        }

    def evaluate_regional_alerts(self, observations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        alerts = []
        for obs in observations:
            region = obs.get("region") or obs.get("name", "Arabian Sea (Eastern Basin)")
            sst = obs.get("temperature", 28.5)
            do = obs.get("dissolved_oxygen", 5.0)
            res = self.assess_thermal_stress(region, sst, do)
            res["station_id"] = obs.get("station_id")
            res["latitude"] = obs.get("latitude")
            res["longitude"] = obs.get("longitude")
            alerts.append(res)
        return alerts

# Global detector instance
mhw_ai = MarineHeatwaveDetector()

if __name__ == "__main__":
    status = mhw_ai.assess_thermal_stress("Lakshadweep Sea", 30.8, 3.2)
    print("MHW Assessment:", status)
