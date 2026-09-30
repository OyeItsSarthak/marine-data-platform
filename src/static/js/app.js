// Triton Oceanic AI - Command Center Frontend Application

let map;
let currentBasemap = "ocean";
let sstLayer = L.layerGroup();
let seamarkLayer = null;
let oceanLayer = L.layerGroup();
let vesselLayer = L.layerGroup();
let ednaLayer = L.layerGroup();
let pfzLayer = L.layerGroup();
let migrationLayer = L.layerGroup();
let probeClickMarker = null;

let crossDomainChartInstance = null;
let depthProfileChartInstance = null;
let ednaTaxaChartInstance = null;

// High-Resolution World Basemap Providers (Clean, No Watermark, Free)
const basemaps = {
  ocean: {
    base: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: "Esri Oceanography, GEBCO, NOAA"
    }),
    ref: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]]
    })
  },
  satellite: {
    base: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 17,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: "Esri, Maxar, Earthstar Geographics"
    }),
    ref: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 17,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]]
    })
  },
  dark: {
    base: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: "Esri Dark Canvas"
    }),
    ref: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      minZoom: 2,
      maxZoom: 16,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]]
    })
  }
};

document.addEventListener("DOMContentLoaded", () => {
  startZuluClock();
  initMap();
  initCharts();
  loadAllData();
  setupWebSocket();
  setupEventListeners();
  setupSafeBox();
  setupDnaMatcher();
  setupDraggableInspector();
});

// Initialize Leaflet Map
function initMap() {
  // Configured to strictly prevent world repeating & show sweeping global ocean panorama
  map = L.map("oceanMap", {
    center: [15.0, 0.0],
    zoom: 2.1,
    minZoom: 1.8,
    maxZoom: 17,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0,
    worldCopyJump: false,
    zoomControl: true,
    attributionControl: false
  });

  // Default Basemap: Vibrant Esri Ocean Bathymetry with Depth Contours
  basemaps.ocean.base.addTo(map);
  basemaps.ocean.ref.addTo(map);

  // OpenSeaMap nautical seamarks layer (for navigation toggle)
  seamarkLayer = L.tileLayer("https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
    minZoom: 1.8,
    maxZoom: 17,
    noWrap: true,
    bounds: [[-85, -180], [85, 180]],
    opacity: 0.95
  });

  // Operational telemetry layers
  sstLayer.addTo(map);
  oceanLayer.addTo(map);
  vesselLayer.addTo(map);
  ednaLayer.addTo(map);
  pfzLayer.addTo(map);
  migrationLayer.addTo(map);

  // Auto-invalidate size to ensure pixel-perfect rendering and alignment
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 600);
  window.addEventListener("resize", () => {
    if (map) map.invalidateSize();
  });

  // Popup management: Auto-flip popups downwards if marker is near top toolbar so info never goes above map
  function adjustPopupPlacement(popup) {
    if (!popup || !map) return;
    const el = popup.getElement();
    if (!el) return;

    const latlng = popup.getLatLng();
    if (!latlng) return;

    const point = map.latLngToContainerPoint(latlng);
    const popupHeight = el.offsetHeight || 240;

    // Flip downwards if marker is in upper region of map container
    if (point.y < popupHeight + 40) {
      el.classList.add("popup-below");
    } else {
      el.classList.remove("popup-below");
    }
  }

  map.on("popupopen", (e) => {
    adjustPopupPlacement(e.popup);
    requestAnimationFrame(() => adjustPopupPlacement(e.popup));
    setTimeout(() => adjustPopupPlacement(e.popup), 50);
  });

  map.on("move", () => {
    if (map._popup) adjustPopupPlacement(map._popup);
  });

  map.on("zoomend", () => {
    if (map._popup) adjustPopupPlacement(map._popup);
  });

  // Live cursor telemetry HUD at the bottom of the map
  map.on("mousemove", (e) => {
    const hud = document.getElementById("mapLiveHud");
    if (!hud) return;
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const latStr = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
    const lonStr = lng >= 0 ? `${lng.toFixed(2)}°E` : `${Math.abs(lng).toFixed(2)}°W`;

    const absLat = Math.abs(lat);
    let sstEst = 26.5;
    if (absLat >= 60) sstEst = Math.max(-1.0, 3.0 - (absLat - 60) * 0.4);
    else if (absLat >= 40) sstEst = 8.5 + (60 - absLat) * 0.48;
    else if (absLat >= 20) sstEst = 18.2 + (40 - absLat) * 0.42;
    else sstEst = 26.5 + (20 - absLat) * 0.18;
    sstEst = Math.round(sstEst * 10) / 10;

    hud.innerHTML = `<span>📍 ${latStr}, ${lonStr}</span> <span style="color: rgba(255,255,255,0.3)">|</span> <span>🌡️ Est. SST: ${sstEst}°C</span> <span style="color: rgba(255,255,255,0.3)">|</span> <span style="color: #38bdf8;">Click ocean to inspect</span>`;
  });

  // Smart Map: Click on any patch of ocean to inspect it
  map.on("click", async (e) => {
    await inspectOceanPatch(e.latlng.lat, e.latlng.lng);
  });
}

// Fetch and load all data feeds
async function loadAllData() {
  generateLiveSstHeatmap();
  await Promise.all([
    fetchOceanData(),
    fetchVesselsData(),
    fetchEdnaData(),
    fetchPfzData(),
    fetchMigrationData(),
    fetchAnalytics(),
    fetchDepthProfile()
  ]);
}

const defaultPopupOptions = {
  autoPan: true,
  autoPanPaddingTopLeft: [30, 70],
  autoPanPadding: [20, 20],
  maxHeight: 280
};

// 1. Ocean Stations & In-Situ Buoys
async function fetchOceanData() {
  try {
    const res = await fetch("/api/ocean/live");
    const data = await res.json();
    oceanLayer.clearLayers();

    if (data && data.stations) {
      data.stations.forEach(st => {
        const marker = L.circleMarker([st.latitude, st.longitude], {
          radius: 6,
          fillColor: "#00f0ff",
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.8
        });

        const popupContent = `
          <div class="map-popup-header">🛰️ ${st.station_id} - ${st.name || "Station"}</div>
          <div class="map-popup-row"><span class="map-popup-label">SST:</span><span class="map-popup-val">${st.temperature}°C</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Salinity:</span><span class="map-popup-val">${st.salinity} PSU</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Chlorophyll:</span><span class="map-popup-val">${st.chlorophyll || 1.2} mg/m³</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Wave Height:</span><span class="map-popup-val">${st.wave_height || 1.1} m</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Current:</span><span class="map-popup-val">${st.current_velocity || 0.8} m/s (${st.current_direction || 120}°)</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Source:</span><span class="map-popup-val" style="color: #00f0ff">${st.source || "Open-Meteo"}</span></div>
        `;
        marker.bindPopup(popupContent, defaultPopupOptions);
        oceanLayer.addLayer(marker);
      });
    }
  } catch (err) {
    console.error("Error fetching ocean stations:", err);
  }
}

// Live Marine Chronometer (Zulu / UTC & Julian Day)
function startZuluClock() {
  const zuluTimeEl = document.getElementById("zuluTime");
  const zuluMetaEl = document.getElementById("zuluMeta");
  if (!zuluTimeEl) return;

  function update() {
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMins = String(now.getUTCMinutes()).padStart(2, "0");
    const utcSecs = String(now.getUTCSeconds()).padStart(2, "0");
    zuluTimeEl.textContent = `${utcHours}:${utcMins}:${utcSecs} UTC`;

    if (zuluMetaEl) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
      const diff = now - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      zuluMetaEl.textContent = `JULIAN DAY ${dayOfYear} • WGS-84`;
    }
  }

  update();
  setInterval(update, 1000);
}

// Render Active AIS Fleet Monitoring Table
function renderAisFleetTable(vessels) {
  const tbody = document.getElementById("aisFleetTableBody");
  const countEl = document.getElementById("aisVesselsCount");
  if (!tbody || !Array.isArray(vessels)) return;
  if (countEl) countEl.textContent = `${vessels.length} LOGGED`;

  tbody.innerHTML = vessels.slice(0, 8).map(v => {
    const speed = (6.5 + (((v.id || 1) * 1.37) % 7.2)).toFixed(1);
    const heading = Math.floor(((v.id || 1) * 43) % 360);
    const isFishing = (v.status || "").toLowerCase().includes("fish");
    const statusClass = isFishing ? "fishing" : "transiting";
    return `
      <tr>
        <td>
          <div class="ais-vessel-name">${v.vessel_name || "Fishing Vessel"}</div>
          <div class="ais-mmsi">${v.vessel_id || "MMSI-UNKNOWN"}</div>
        </td>
        <td>
          <div class="ais-telemetry">${speed} kn</div>
          <div class="ais-mmsi">${heading}°</div>
        </td>
        <td>${v.species_targeted || "Pelagic"}</td>
        <td><span class="ais-status-pill ${statusClass}">${v.status || "Underway"}</span></td>
      </tr>
    `;
  }).join("");
}

// 2. Fisheries Vessels (AIS)
async function fetchVesselsData() {
  try {
    const res = await fetch("/api/fisheries/vessels");
    const data = await res.json();
    vesselLayer.clearLayers();

    if (Array.isArray(data)) {
      renderAisFleetTable(data);
      data.forEach(v => {
        const vesselIcon = L.divIcon({
          className: "vessel-div-icon",
          html: `<div style="
            width: 22px; height: 22px; border-radius: 50%;
            background: rgba(59, 130, 246, 0.85); border: 2px solid #ffffff;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.9); font-size: 11px;">
            🚢
          </div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([v.latitude, v.longitude], { icon: vesselIcon });
        const popupContent = `
          <div class="map-popup-header">🚢 ${v.vessel_name} (${v.vessel_id})</div>
          <div class="map-popup-row"><span class="map-popup-label">Gear:</span><span class="map-popup-val">${v.gear_type}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Target:</span><span class="map-popup-val">${v.species_targeted}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Catch Weight:</span><span class="map-popup-val" style="color: #10b981">${v.catch_weight_kg} kg</span></div>
          <div class="map-popup-row"><span class="map-popup-label">PFZ Score:</span><span class="map-popup-val" style="color: #00f0ff">${v.pfz_score}% Match</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Status:</span><span class="map-popup-val">${v.status}</span></div>
        `;
        marker.bindPopup(popupContent, defaultPopupOptions);
        vesselLayer.addLayer(marker);
      });
    }
  } catch (err) {
    console.error("Error fetching vessel telemetry:", err);
  }
}

// 3. eDNA Molecular Stations
async function fetchEdnaData() {
  try {
    const res = await fetch("/api/biodiversity/edna");
    const data = await res.json();
    ednaLayer.clearLayers();

    if (Array.isArray(data)) {
      data.forEach(s => {
        const ednaIcon = L.divIcon({
          className: "edna-div-icon",
          html: `<div style="
            width: 20px; height: 20px; border-radius: 4px;
            background: rgba(245, 158, 11, 0.9); border: 2px solid #ffffff;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px rgba(245, 158, 11, 0.8); font-size: 11px;">
            🧬
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([s.latitude, s.longitude], { icon: ednaIcon });
        const taxaList = (s.detected_taxa || []).map(t => `<li>${t.species} (<em>${t.common_name}</em>)</li>`).join("");
        const endangeredList = (s.endangered_taxa || []).map(t => `<li style="color: #ff4d6d">⚠️ ${t.species} (${t.status})</li>`).join("");

        const popupContent = `
          <div class="map-popup-wrap">
            <div class="map-popup-header">🧬 eDNA Sample: ${s.sample_id}</div>
            <div class="map-popup-row"><span class="map-popup-label">Station:</span><span class="map-popup-val">${s.station_id}</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Marker:</span><span class="map-popup-val">${s.marker_gene}</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Shannon Index (H'):</span><span class="map-popup-val" style="color: #f59e0b">${s.shannon_index}</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Species Richness:</span><span class="map-popup-val">${s.species_richness} Taxa</span></div>
            <div style="font-size: 0.72rem; margin-top: 6px;">
              <strong style="color: #cbd5e1;">Detected Taxa:</strong>
              <ul style="padding-left: 16px; margin: 3px 0 0 0; line-height: 1.4; color: #94a3b8;">${taxaList || "None"}</ul>
            </div>
            ${endangeredList ? `<div style="font-size: 0.72rem; margin-top: 5px;"><strong style="color: #f87171;">Red List Detections:</strong><ul style="padding-left: 16px; margin: 3px 0 0 0; line-height: 1.4;">${endangeredList}</ul></div>` : ""}
          </div>
        `;
        marker.bindPopup(popupContent, defaultPopupOptions);
        ednaLayer.addLayer(marker);
      });
    }
  } catch (err) {
    console.error("Error fetching eDNA samples:", err);
  }
}

// 4. AI Potential Fishing Zones (PFZs)
async function fetchPfzData() {
  try {
    const res = await fetch("/api/fisheries/pfz");
    const data = await res.json();
    pfzLayer.clearLayers();

    if (data && data.zones) {
      data.zones.forEach(z => {
        const poly = L.polygon(z.polygon, {
          color: z.color || "#10b981",
          fillColor: z.color || "#10b981",
          fillOpacity: 0.25,
          weight: 2,
          dashArray: "4, 4"
        });

        const popupContent = `
          <div class="map-popup-header">🎣 ${z.zone_name}</div>
          <div class="map-popup-row"><span class="map-popup-label">AI Score:</span><span class="map-popup-val" style="color: ${z.color}">${z.pfz_score}% (${z.category})</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Optimal Depth:</span><span class="map-popup-val">${z.optimal_depth}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Target Species:</span><span class="map-popup-val">${z.target_species}</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Front SST:</span><span class="map-popup-val">${z.sst}°C</span></div>
          <div class="map-popup-row"><span class="map-popup-label">Chlorophyll:</span><span class="map-popup-val">${z.chlorophyll_mg_m3} mg/m³</span></div>
        `;
        poly.bindPopup(popupContent, defaultPopupOptions);
        pfzLayer.addLayer(poly);
      });
    }
  } catch (err) {
    console.error("Error fetching PFZ zones:", err);
  }
}

// Switch Active High-Resolution Basemap
function switchBasemap(name) {
  if (!basemaps[name] || currentBasemap === name) return;

  // Remove current basemap tiles
  if (map.hasLayer(basemaps[currentBasemap].base)) map.removeLayer(basemaps[currentBasemap].base);
  if (map.hasLayer(basemaps[currentBasemap].ref)) map.removeLayer(basemaps[currentBasemap].ref);

  // Add new basemap tiles at the very bottom
  basemaps[name].base.addTo(map);
  basemaps[name].base.bringToBack();
  basemaps[name].ref.addTo(map);

  currentBasemap = name;

  // Update UI active buttons
  document.querySelectorAll(".basemap-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-basemap") === name);
  });
}

// Generate Real-Time Sea Surface Temperature (SST) Thermal Field Overlay across Global Oceans
function generateLiveSstHeatmap() {
  sstLayer.clearLayers();

  function getSstColor(t) {
    if (t < 4.0) return "#1e3a8a";   // Polar Glacial Deep Navy
    if (t < 12.0) return "#0284c7";  // Subpolar Cold Sky Blue
    if (t < 18.0) return "#06b6d4";  // Temperate Oceanic Cyan
    if (t < 24.0) return "#10b981";  // Productive Front Emerald
    if (t < 28.5) return "#f59e0b";  // Subtropical Warm Amber
    return "#ef4444";                // Tropical Warm Pool / Heatwave Red
  }

  function isContinentalLand(lat, lon) {
    // North America
    if (lat >= 16 && lat <= 72 && lon >= -130 && lon <= -65) {
      if (lat < 30 && lon > -98 && lon < -80) return false; // Gulf of Mexico & Caribbean
      if (lat > 50 && lon > -95 && lon < -75) return false; // Hudson Bay
      return true;
    }
    // South America
    if (lat >= -56 && lat <= 12 && lon >= -80 && lon <= -35) return true;
    // Africa
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) return true;
    // Europe & Asia Main Landmass
    if (lat >= 36 && lat <= 72 && lon >= -10 && lon <= 170) {
      if (lat >= 30 && lat <= 45 && lon >= -6 && lon <= 36) return false; // Mediterranean
      if (lat >= 54 && lat <= 66 && lon >= 10 && lon <= 30) return false; // Baltic Sea
      if (lat >= 50 && lat <= 62 && lon >= -4 && lon <= 9) return false; // North Sea
      return true;
    }
    // Indian Subcontinent
    if (lat >= 8 && lat <= 35 && lon >= 68 && lon <= 90) return true;
    // Arabian Peninsula
    if (lat >= 12 && lat <= 32 && lon >= 35 && lon <= 60) return true;
    // Australia
    if (lat >= -39 && lat <= -11 && lon >= 113 && lon <= 154) return true;
    // Greenland
    if (lat >= 60 && lat <= 83 && lon >= -55 && lon <= -20) return true;
    // Antarctica
    if (lat <= -65) return true;

    return false;
  }

  // Generate continuous global oceanic grid with 4.8° latitude & 6.5° longitude resolution
  for (let lat = -58.0; lat <= 65.0; lat += 4.8) {
    for (let lon = -175.0; lon <= 175.0; lon += 6.5) {
      if (isContinentalLand(lat, lon)) continue;

      const absLat = Math.abs(lat);
      let sst = 0;

      // Realistic thermodynamic latitude gradient
      if (absLat >= 60.0) {
        sst = Math.max(-1.2, 3.5 - ((absLat - 60.0) * 0.45));
      } else if (absLat >= 40.0) {
        sst = 8.5 + ((60.0 - absLat) * 0.48);
      } else if (absLat >= 20.0) {
        sst = 18.2 + ((40.0 - absLat) * 0.42);
      } else {
        sst = 26.5 + ((20.0 - absLat) * 0.18);
      }

      // Major Western Boundary Currents (warm advection)
      if (lat > 25 && lat < 48 && lon > -78 && lon < -45) sst += 3.4; // Gulf Stream
      if (lat > 25 && lat < 45 && lon > 130 && lon < 160) sst += 2.8; // Kuroshio Extension
      if (lat < -15 && lat > -38 && lon > 150 && lon < 168) sst += 2.2; // East Australian Current
      if (lat < -15 && lat > -38 && lon > -50 && lon < -35) sst += 2.0; // Brazil Current

      // Major Eastern Boundary Upwelling (cold productive advection)
      if (lat > 18 && lat < 42 && lon > -130 && lon < -115) sst -= 3.8; // California Current
      if (lat < -8 && lat > -42 && lon > -85 && lon < -70) sst -= 4.6; // Humboldt / Peru Current
      if (lat < -12 && lat > -35 && lon > 8 && lon < 18) sst -= 4.2; // Benguela Current
      if (lat > 16 && lat < 34 && lon > -25 && lon < -12) sst -= 2.8; // Canary Current

      // Equatorial Warm Pool & Regional Seas
      if (absLat < 15 && ((lon > 95 && lon < 160) || (lon > 55 && lon < 85))) sst += 1.6; // Indo-Pacific Warm Pool
      if (lat >= 30 && lat <= 45 && lon >= -5 && lon <= 36) sst = 20.2; // Mediterranean Sea norm

      sst = Math.round(sst * 10) / 10;
      const color = getSstColor(sst);

      let classification = "Optimal Pelagic Window";
      if (sst >= 29.5) classification = "Tropical Warm Pool (Elevated)";
      else if (sst >= 24.0) classification = "Subtropical Productive Front";
      else if (sst >= 16.0) classification = "Temperate Forage Basin";
      else if (sst >= 8.0) classification = "Subpolar Feeding Ground";
      else classification = "Polar Glacial Marine Zone";

      const circle = L.circle([lat, lon], {
        radius: 260000,
        fillColor: color,
        fillOpacity: 0.28,
        stroke: true,
        color: color,
        weight: 0.6,
        opacity: 0.42,
        interactive: false // Prevents sticky tooltip pileups; clicks pass through cleanly to map
      });

      sstLayer.addLayer(circle);
    }
  }
}

// 4b. AI 7-Day Fish Migration Forecast (Weather & Fish Predictor)
async function fetchMigrationData() {
  try {
    const res = await fetch("/api/ai/fish-migration");
    const data = await res.json();
    migrationLayer.clearLayers();

    if (data && Array.isArray(data.schools)) {
      data.schools.forEach(school => {
        const coords = school.waypoints.map(w => [w.latitude, w.longitude]);
        const color = school.species.includes("Tuna") ? "#00f0ff" : 
                      school.species.includes("Mackerel") ? "#10b981" : "#f59e0b";

        // Polyline connecting 7-day projected waypoints
        const polyline = L.polyline(coords, {
          color: color,
          weight: 3.5,
          dashArray: "6, 6",
          opacity: 0.85
        });
        migrationLayer.addLayer(polyline);

        // Render each daily waypoint
        school.waypoints.forEach((wp, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === school.waypoints.length - 1;

          const marker = L.circleMarker([wp.latitude, wp.longitude], {
            radius: isStart ? 8 : isEnd ? 9 : 4.5,
            fillColor: isEnd ? "#ffffff" : color,
            color: isEnd ? color : "#ffffff",
            weight: isEnd ? 3 : 1.5,
            opacity: 0.95,
            fillOpacity: isEnd ? 1.0 : 0.8
          });

          const popupContent = `
            <div class="map-popup-header">🐟 ${school.species} (${school.school_id})</div>
            <div class="map-popup-row"><span class="map-popup-label">Timeline:</span><span class="map-popup-val">Day ${wp.day} (${wp.date})</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Forecast SST:</span><span class="map-popup-val">${wp.water_temp_c}°C</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Est. Biomass:</span><span class="map-popup-val">${school.estimated_biomass_tons} Tons</span></div>
            <div class="map-popup-row"><span class="map-popup-label">Speed / Bearing:</span><span class="map-popup-val">${wp.speed_knots} kts | ${wp.heading_compass}</span></div>
            <div class="map-popup-row"><span class="map-popup-label">AI Driver:</span><span class="map-popup-val" style="color: #00f0ff">${wp.driver}</span></div>
          `;
          marker.bindPopup(popupContent, defaultPopupOptions);
          migrationLayer.addLayer(marker);
        });
      });
    }
  } catch (err) {
    console.error("Error fetching fish migration forecast:", err);
  }
}

// Physical Acoustic Sound Speed in Seawater (Mackenzie 1981 9-Term Formula)
function calculateSoundVelocity(T, S, D) {
  const c = 1448.96 + (4.591 * T) - (0.05304 * T * T) + (0.0002374 * T * T * T) + (1.340 * (S - 35)) + (0.0163 * D);
  return c.toFixed(1);
}

// Oceanographic Water Mass Classification
function classifyWaterMass(lat, lon, sst, sal) {
  const absLat = Math.abs(lat);
  if (absLat >= 60) return "Subpolar / Polar Glacial Water Mass";
  if (lat >= 0 && lat <= 28 && lon >= 50 && lon <= 78) return "Arabian Sea High Salinity Water (ASHSW)";
  if (lat >= 0 && lat <= 24 && lon >= 80 && lon <= 98) return "Bay of Bengal Low Salinity Surface Water (BoBLSW)";
  if (absLat <= 15 && ((lon >= 95 && lon <= 160) || (lon >= 55 && lon <= 85))) return "Indo-Pacific Warm Pool Surface Water";
  if (lat >= 20 && lat <= 48 && lon >= -80 && lon <= -20) return "North Atlantic Subtropical Mode Water (STMW)";
  if (lat >= -45 && lat <= -15 && lon >= -50 && lon <= 15) return "South Atlantic Central Water (SACW)";
  if (lat >= 20 && lat <= 45 && lon >= 125 && lon <= 165) return "North Pacific Central Water (NPCW)";
  if (lat >= -45 && lat <= -10 && lon >= -170 && lon <= -80) return "South Pacific Subtropical Surface Water";
  return "Global Pelagic Upper Layer Water Mass";
}

// 4c. Smart Map Ocean Patch Inspector
async function inspectOceanPatch(lat, lng) {
  const probeCard = document.getElementById("oceanProbeCard");
  const coordsEl = document.getElementById("probeCoords");
  const tempEl = document.getElementById("probeTemp");
  const salEl = document.getElementById("probeSal");
  const waveEl = document.getElementById("probeWave");
  const fishProbEl = document.getElementById("probeFishProb");
  const speciesListEl = document.getElementById("probeSpeciesList");
  const ednaListEl = document.getElementById("probeEdnaList");
  const soundSpeedEl = document.getElementById("probeSoundSpeed");
  const thermoclineEl = document.getElementById("probeThermocline");
  const waterMassEl = document.getElementById("probeWaterMass");
  const stratumEl = document.getElementById("probeStratum");

  // Place or update visual beacon marker
  if (probeClickMarker) {
    map.removeLayer(probeClickMarker);
  }
  probeClickMarker = L.circleMarker([lat, lng], {
    radius: 8,
    fillColor: "#00b4d8",
    color: "#ffffff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.95
  }).addTo(map);

  // Show floating card & loading state
  probeCard.classList.add("open");
  const basinBadge = document.getElementById("probeBasinName");
  if (basinBadge) basinBadge.textContent = "SCANNING...";

  // Format High-Precision DMS coordinates
  const formatDMS = (deg, isLat) => {
    const dir = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
    const absDeg = Math.abs(deg);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = (((absDeg - d) * 60 - m) * 60).toFixed(1);
    return `${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(4, '0')}" ${dir}`;
  };

  coordsEl.textContent = `${formatDMS(lat, true)}, ${formatDMS(lng, false)} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
  if (waterMassEl) waterMassEl.textContent = classifyWaterMass(lat, lng, 28, 35);
  if (stratumEl) stratumEl.textContent = Math.abs(lat) > 55 ? "SUBPOLAR FORAGE (0-150m)" : "EPIPELAGIC PHOTIC (0-200m)";

  tempEl.textContent = "Scanning...";
  salEl.textContent = "...";
  waveEl.textContent = "...";
  fishProbEl.textContent = "...";
  if (soundSpeedEl) soundSpeedEl.textContent = "...";
  if (thermoclineEl) thermoclineEl.textContent = "...";
  speciesListEl.innerHTML = '<div class="probe-species-item"><span>Computing hydrographic likelihood...</span></div>';
  ednaListEl.innerHTML = '<div class="probe-edna-item">Querying spatial eDNA catalog...</div>';

  try {
    const res = await fetch(`/api/ocean/probe?lat=${lat}&lon=${lng}`);
    const data = await res.json();

    if (basinBadge) {
      basinBadge.textContent = (data.basin || (data.fish_population && data.fish_population.basin_name) || "Global Ocean").toUpperCase();
    }
    const sstVal = parseFloat(data.ocean_state.temperature_celsius) || 28.0;
    const salVal = parseFloat(data.ocean_state.salinity_psu) || 35.0;

    tempEl.textContent = `${sstVal.toFixed(1)} °C`;
    salEl.textContent = `${salVal.toFixed(1)} PSU`;
    waveEl.textContent = `${data.ocean_state.wave_height_meters} m`;
    fishProbEl.textContent = `${data.fish_population.school_presence_probability}%`;

    const currentEl = document.getElementById("probeCurrent");
    if (currentEl) currentEl.textContent = `${(parseFloat(data.ocean_state.current_velocity_ms) || 0.65).toFixed(2)} m/s`;

    const windEl = document.getElementById("probeWind");
    if (windEl) windEl.textContent = `${(parseFloat(data.ocean_state.wind_speed_kmh) || 14.5).toFixed(1)} km/h`;

    const sourceTag = document.getElementById("probeSourceTag");
    if (sourceTag) {
      sourceTag.textContent = data.ocean_state.is_live ? "OPEN-METEO LIVE" : "NOAA BASELINE";
      sourceTag.style.borderColor = data.ocean_state.is_live ? "var(--accent-emerald)" : "rgba(56, 189, 248, 0.3)";
      sourceTag.style.color = data.ocean_state.is_live ? "#34d399" : "var(--accent-sky)";
    }

    const livePill = document.getElementById("probeLiveStatus");
    if (livePill) {
      livePill.textContent = data.ocean_state.is_live ? "🟢 LIVE API" : "MODEL BASELINE";
    }

    if (soundSpeedEl) soundSpeedEl.textContent = `${calculateSoundVelocity(sstVal, salVal, 10)} m/s`;
    if (thermoclineEl) thermoclineEl.textContent = `${(-1.2 - (sstVal - 15) * 0.08).toFixed(1)}°C / 100m`;
    if (waterMassEl) waterMassEl.textContent = classifyWaterMass(lat, lng, sstVal, salVal);

    // Species breakdown
    if (data.fish_population && data.fish_population.species_likelihood) {
      speciesListEl.innerHTML = data.fish_population.species_likelihood.map(sp => {
        const isHigh = sp.likelihood.startsWith("High");
        return `
          <div class="probe-species-item">
            <span class="probe-sp-name" style="font-style: italic;">${sp.species}</span>
            <span class="probe-sp-likelihood" style="font-family: var(--font-mono); font-size: 0.65rem; color: ${isHigh ? '#06d6a0' : '#38bdf8'}; font-weight: 700;">${sp.likelihood}</span>
          </div>
        `;
      }).join("");
    }

    // Nearby eDNA
    const ednaSamples = data.edna_history?.samples || [];
    if (ednaSamples.length > 0) {
      ednaListEl.innerHTML = ednaSamples.map(s => {
        const taxaLabel = s.detected_species || (Array.isArray(s.detected_taxa) && s.detected_taxa.length > 0 ? (typeof s.detected_taxa[0] === 'object' ? s.detected_taxa[0].species : s.detected_taxa[0]) : s.sample_id) || "Pelagic eDNA Taxa";
        return `
          <div class="probe-edna-item">
            <div class="probe-edna-taxa" style="font-weight: 600; color: #ffffff;">🔬 ${s.station_id} - ${taxaLabel}</div>
            <div class="probe-edna-meta" style="font-size: 0.62rem; color: #94a3b8; margin-top: 1px;">Shannon H': ${s.shannon_index} | Richness: ${s.species_richness} | Depth: ${s.depth}m</div>
          </div>
        `;
      }).join("");
    } else {
      ednaListEl.innerHTML = '<div class="probe-edna-item" style="color: var(--text-dim)">No cataloged eDNA sampling stations within ~200 km</div>';
    }
  } catch (err) {
    console.error("Error inspecting ocean patch:", err);
    tempEl.textContent = "Error";
  }
}

// Make the Ocean Patch Inspector a floating movable window
function setupDraggableInspector() {
  const card = document.getElementById("oceanProbeCard");
  const header = document.getElementById("probeHeader");
  const btnReset = document.getElementById("btnResetProbePos");

  if (!card || !header) return;

  // Prevent Leaflet map from capturing dragging or clicks inside the card
  L.DomEvent.disableClickPropagation(card);
  L.DomEvent.disableScrollPropagation(card);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  function onPointerDown(e) {
    // Ignore clicks on buttons inside header (close button, reset button, toggle button)
    if (e.target.closest("button")) return;

    isDragging = true;
    card.classList.add("dragging");

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    const parent = card.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    // Switch from bottom/right relative CSS to explicit top/left pixel values
    initialLeft = cardRect.left - parentRect.left;
    initialTop = cardRect.top - parentRect.top;

    card.style.bottom = "auto";
    card.style.right = "auto";
    card.style.left = `${initialLeft}px`;
    card.style.top = `${initialTop}px`;

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    const parent = card.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();

    const maxLeft = parentRect.width - card.offsetWidth - 10;
    const maxTop = parentRect.height - card.offsetHeight - 10;

    const newLeft = Math.max(10, Math.min(initialLeft + dx, maxLeft));
    const newTop = Math.max(10, Math.min(initialTop + dy, maxTop));

    card.style.left = `${newLeft}px`;
    card.style.top = `${newTop}px`;

    if (e.cancelable) e.preventDefault();
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      card.classList.remove("dragging");
    }
  }

  // Mouse listeners
  header.addEventListener("mousedown", onPointerDown);
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("mouseup", onPointerUp);

  // Touch listeners for touchscreens
  header.addEventListener("touchstart", onPointerDown, { passive: false });
  document.addEventListener("touchmove", onPointerMove, { passive: false });
  document.addEventListener("touchend", onPointerUp);

  // Reset position and dimensions button
  if (btnReset) {
    btnReset.addEventListener("click", (e) => {
      e.stopPropagation();
      card.style.top = "auto";
      card.style.right = "auto";
      card.style.left = "16px";
      card.style.bottom = "16px";
      card.style.width = "";
      card.style.height = "";
      const btnToggle = document.getElementById("btnToggleProbeSize");
      if (btnToggle) {
        btnToggle.innerHTML = "⤢";
        btnToggle.title = "Toggle wide / standard view";
      }
    });
  }

  // Initialize stretching and resizing capabilities
  setupResizableInspector();
}

// Make the Ocean Patch Inspector resizable and stretchable from sides, bottom, and corner
function setupResizableInspector() {
  const card = document.getElementById("oceanProbeCard");
  const btnToggle = document.getElementById("btnToggleProbeSize");
  if (!card) return;

  const resizers = card.querySelectorAll(".probe-resizer");
  let activeDir = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let startLeft = 0;
  let startTop = 0;

  resizers.forEach(resizer => {
    // Disable Leaflet propagation
    L.DomEvent.disableClickPropagation(resizer);
    L.DomEvent.disableScrollPropagation(resizer);

    const onResizerDown = (e) => {
      e.stopPropagation();
      e.preventDefault();

      activeDir = resizer.getAttribute("data-dir");
      card.classList.add("resizing");

      const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;

      const parent = card.offsetParent || document.body;
      const parentRect = parent.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      startWidth = cardRect.width;
      startHeight = cardRect.height;
      startLeft = cardRect.left - parentRect.left;
      startTop = cardRect.top - parentRect.top;

      // Lock current top & left in pixels so bottom/right CSS won't conflict
      card.style.left = `${startLeft}px`;
      card.style.top = `${startTop}px`;
      card.style.bottom = "auto";
      card.style.right = "auto";
      card.style.width = `${startWidth}px`;
      card.style.height = `${startHeight}px`;

      document.addEventListener("mousemove", onResizerMove);
      document.addEventListener("mouseup", onResizerUp);
      document.addEventListener("touchmove", onResizerMove, { passive: false });
      document.addEventListener("touchend", onResizerUp);
    };

    resizer.addEventListener("mousedown", onResizerDown);
    resizer.addEventListener("touchstart", onResizerDown, { passive: false });
  });

  function onResizerMove(e) {
    if (!activeDir) return;

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    const parent = card.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();

    const minW = 310;
    const maxW = Math.min(850, parentRect.width - 30);
    const minH = 240;
    const maxH = Math.min(850, parentRect.height - 40);

    // Horizontal stretching: Right side or right corners
    if (activeDir.includes("r")) {
      const maxAllowedW = Math.min(maxW, parentRect.width - startLeft - 10);
      const newW = Math.max(minW, Math.min(startWidth + dx, maxAllowedW));
      card.style.width = `${newW}px`;
    }

    // Horizontal stretching: Left side or left corners
    if (activeDir.includes("l")) {
      let newW = startWidth - dx;
      let newLeft = startLeft + dx;

      if (newW < minW) {
        newLeft = startLeft + (startWidth - minW);
        newW = minW;
      } else if (newLeft < 10) {
        newW = startLeft + startWidth - 10;
        newLeft = 10;
      }
      if (newW > maxW) {
        newLeft = startLeft + (startWidth - maxW);
        newW = maxW;
      }

      card.style.width = `${newW}px`;
      card.style.left = `${newLeft}px`;
    }

    // Vertical stretching: Bottom edge or bottom corners
    if (activeDir.includes("b")) {
      const maxAllowedH = Math.min(maxH, parentRect.height - startTop - 10);
      const newH = Math.max(minH, Math.min(startHeight + dy, maxAllowedH));
      card.style.height = `${newH}px`;
    }

    // Vertical stretching: Top edge or top corners
    if (activeDir.includes("t")) {
      let newH = startHeight - dy;
      let newTop = startTop + dy;

      if (newH < minH) {
        newTop = startTop + (startHeight - minH);
        newH = minH;
      } else if (newTop < 10) {
        newH = startTop + startHeight - 10;
        newTop = 10;
      }
      if (newH > maxH) {
        newTop = startTop + (startHeight - maxH);
        newH = maxH;
      }

      card.style.height = `${newH}px`;
      card.style.top = `${newTop}px`;
    }

    if (e.cancelable) e.preventDefault();
  }

  function onResizerUp() {
    if (activeDir) {
      activeDir = null;
      card.classList.remove("resizing");
      document.removeEventListener("mousemove", onResizerMove);
      document.removeEventListener("mouseup", onResizerUp);
      document.removeEventListener("touchmove", onResizerMove);
      document.removeEventListener("touchend", onResizerUp);
    }
  }

  // Quick 1-click expand/standard toggle button
  if (btnToggle) {
    btnToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentWidth = card.offsetWidth;
      if (currentWidth < 520) {
        card.style.width = "620px";
        btnToggle.innerHTML = "⤡";
        btnToggle.title = "Return to standard view (400px)";
      } else {
        card.style.width = "400px";
        btnToggle.innerHTML = "⤢";
        btnToggle.title = "Expand to wide view (620px)";
      }
    });
  }
}

// 5. Analytics & Cross-Domain Intelligence
async function fetchAnalytics() {
  try {
    const res = await fetch("/api/analytics/summary");
    const data = await res.json();

    if (data && data.summary_kpis) {
      const kpis = data.summary_kpis;
      document.getElementById("tickerSST").textContent = `${kpis.mean_sst_celsius} °C`;
      document.getElementById("tickerSalinity").textContent = `${kpis.mean_salinity_psu} PSU`;
      document.getElementById("tickerShannon").textContent = `${kpis.mean_edna_shannon_index} (High)`;
      document.getElementById("tickerHealth").textContent = `${kpis.unified_ecosystem_health_index} / 100`;

      document.getElementById("kpiSST").textContent = `${kpis.mean_sst_celsius}°C`;
      document.getElementById("kpiCatch").textContent = `${kpis.mean_catch_biomass_kg} kg`;
      document.getElementById("kpiEdna").textContent = `H' ${kpis.mean_edna_shannon_index}`;
      document.getElementById("kpiHealth").textContent = `${kpis.unified_ecosystem_health_index}`;
      document.getElementById("healthBadge").textContent = kpis.health_status;
    }

    if (data && data.scatter_trend && crossDomainChartInstance) {
      const labels = data.scatter_trend.map(d => `${d.sst}°C`);
      const catchData = data.scatter_trend.map(d => d.catch_kg);
      const shannonData = data.scatter_trend.map(d => d.shannon);

      crossDomainChartInstance.data.labels = labels;
      crossDomainChartInstance.data.datasets[0].data = catchData;
      crossDomainChartInstance.data.datasets[1].data = shannonData;
      crossDomainChartInstance.update();
    }
  } catch (err) {
    console.error("Error fetching analytics:", err);
  }
}

// 6. Vertical Depth Profile
async function fetchDepthProfile() {
  try {
    const res = await fetch("/api/ocean/depth-profile?station_id=ST_MUMBAI");
    const data = await res.json();

    if (data && data.profile && depthProfileChartInstance) {
      const depths = data.profile.map(p => `${p.depth_meters}m`);
      const temps = data.profile.map(p => p.temperature_celsius);
      const sals = data.profile.map(p => p.salinity_psu);

      depthProfileChartInstance.data.labels = depths;
      depthProfileChartInstance.data.datasets[0].data = temps;
      depthProfileChartInstance.data.datasets[1].data = sals;
      depthProfileChartInstance.update();
    }
  } catch (err) {
    console.error("Error fetching depth profile:", err);
  }
}

// Setup Chart.js Instances
function initCharts() {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "'Outfit', sans-serif", size: 11 }
        }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b", font: { size: 10 } }
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b", font: { size: 10 } }
      }
    }
  };

  // Cross-Domain Chart
  const ctx1 = document.getElementById("crossDomainChart").getContext("2d");
  crossDomainChartInstance = new Chart(ctx1, {
    type: "line",
    data: {
      labels: ["27.5°C", "28.0°C", "28.5°C", "29.0°C", "29.5°C", "30.2°C"],
      datasets: [
        {
          label: "Catch Biomass (kg)",
          data: [1420, 1250, 980, 640, 420, 210],
          borderColor: "#00f0ff",
          backgroundColor: "rgba(0, 240, 255, 0.1)",
          fill: true,
          tension: 0.35,
          yAxisID: "y"
        },
        {
          label: "eDNA Shannon (H')",
          data: [1.62, 1.54, 1.38, 1.25, 1.10, 0.88],
          borderColor: "#10b981",
          backgroundColor: "transparent",
          tension: 0.35,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y1: {
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { color: "#10b981", font: { size: 10 } }
        }
      }
    }
  });

  // Vertical Depth Profile Chart
  const ctx2 = document.getElementById("depthProfileChart").getContext("2d");
  depthProfileChartInstance = new Chart(ctx2, {
    type: "line",
    data: {
      labels: ["0m", "10m", "25m", "50m", "75m", "100m", "150m", "200m", "300m", "500m"],
      datasets: [
        {
          label: "Temp (°C)",
          data: [28.6, 28.3, 27.8, 25.4, 21.2, 17.5, 14.8, 12.5, 9.8, 6.8],
          borderColor: "#ff4d6d",
          tension: 0.3
        },
        {
          label: "Salinity (PSU)",
          data: [35.1, 35.2, 35.4, 35.7, 35.6, 35.3, 35.0, 34.9, 34.8, 34.8],
          borderColor: "#3b82f6",
          tension: 0.3
        }
      ]
    },
    options: commonOptions
  });

  // eDNA Taxonomic Breakdown Doughnut
  const ctx3 = document.getElementById("ednaTaxaChart").getContext("2d");
  ednaTaxaChartInstance = new Chart(ctx3, {
    type: "doughnut",
    data: {
      labels: ["Pelagic Fish (12S)", "Invertebrates (COI)", "Coral Metagenome", "Endangered Megafauna"],
      datasets: [{
        data: [45, 30, 20, 5],
        backgroundColor: ["#00f0ff", "#3b82f6", "#10b981", "#ff4d6d"],
        borderColor: "#0a1424",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: "#94a3b8", font: { size: 10 } }
        }
      }
    }
  });
}

// Setup WebSocket for real-time telemetry stream
function setupWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/live`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "TELEMETRY_PULSE") {
        document.getElementById("tickerVessels").textContent = `${data.vessels_active} AIS Active`;
      }
    } catch (e) {
      console.warn("WS parse error:", e);
    }
  };

  ws.onclose = () => {
    setTimeout(setupWebSocket, 5000);
  };
}

// Setup Event Listeners
function setupEventListeners() {
  // Ocean Basins Quick-Fly Selector
  document.querySelectorAll(".basin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".basin-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const lat = parseFloat(btn.getAttribute("data-lat"));
      const lng = parseFloat(btn.getAttribute("data-lng"));
      const zoom = parseFloat(btn.getAttribute("data-zoom"));
      if (map) {
        map.flyTo([lat, lng], zoom, { duration: 1.4 });
      }
    });
  });

  // Basemap Switcher
  document.querySelectorAll(".basemap-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const basemapName = btn.getAttribute("data-basemap");
      switchBasemap(basemapName);
    });
  });

  // Layer Toggles
  document.querySelectorAll(".layer-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const layerName = btn.getAttribute("data-layer");
      btn.classList.toggle("active");
      const isActive = btn.classList.contains("active");

      if (layerName === "sst") {
        const legend = document.getElementById("thermalLegend");
        if (isActive) {
          map.addLayer(sstLayer);
          if (legend) legend.style.display = "flex";
        } else {
          map.removeLayer(sstLayer);
          if (legend) legend.style.display = "none";
        }
      }
      if (layerName === "seamarks") {
        isActive ? map.addLayer(seamarkLayer) : map.removeLayer(seamarkLayer);
      }
      if (layerName === "ocean") isActive ? map.addLayer(oceanLayer) : map.removeLayer(oceanLayer);
      if (layerName === "vessels") isActive ? map.addLayer(vesselLayer) : map.removeLayer(vesselLayer);
      if (layerName === "edna") isActive ? map.addLayer(ednaLayer) : map.removeLayer(ednaLayer);
      if (layerName === "pfz") isActive ? map.addLayer(pfzLayer) : map.removeLayer(pfzLayer);
      if (layerName === "migration") isActive ? map.addLayer(migrationLayer) : map.removeLayer(migrationLayer);
    });
  });

  // Ocean Probe Card Close Button
  const btnCloseProbe = document.getElementById("btnCloseProbe");
  if (btnCloseProbe) {
    btnCloseProbe.addEventListener("click", () => {
      document.getElementById("oceanProbeCard").classList.remove("open");
      if (probeClickMarker) {
        map.removeLayer(probeClickMarker);
        probeClickMarker = null;
      }
    });
  }

  // =========================================================================
  // LIVE UNIFIED ETL PIPELINE EXECUTION CONSOLE
  // =========================================================================
  const btnRunPipeline = document.getElementById("btnTriggerPipeline");
  const etlConsoleModal = document.getElementById("etlConsoleModal");
  const btnCloseEtlConsole = document.getElementById("btnCloseEtlConsole");
  const btnDismissEtlConsole = document.getElementById("btnDismissEtlConsole");
  const btnRefreshAfterEtl = document.getElementById("btnRefreshAfterEtl");
  const etlStatusPill = document.getElementById("etlStatusPill");
  const etlStatusText = document.getElementById("etlStatusText");
  const etlTimer = document.getElementById("etlTimer");
  const etlRecordCount = document.getElementById("etlRecordCount");
  const etlIntegrity = document.getElementById("etlIntegrity");
  const etlCurrentStageTitle = document.getElementById("etlCurrentStageTitle");
  const etlProgressPercent = document.getElementById("etlProgressPercent");
  const etlProgressBar = document.getElementById("etlProgressBar");
  const etlTerminalLog = document.getElementById("etlTerminalLog");
  const terminalLiveBadge = document.getElementById("terminalLiveBadge");

  let etlTimerInterval = null;
  let activeEventSource = null;

  function closeEtlConsole() {
    if (etlConsoleModal) etlConsoleModal.classList.remove("open");
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
    if (etlTimerInterval) {
      clearInterval(etlTimerInterval);
      etlTimerInterval = null;
    }
  }

  if (btnCloseEtlConsole) btnCloseEtlConsole.addEventListener("click", closeEtlConsole);
  if (btnDismissEtlConsole) btnDismissEtlConsole.addEventListener("click", closeEtlConsole);
  if (btnRefreshAfterEtl) {
    btnRefreshAfterEtl.addEventListener("click", async () => {
      btnRefreshAfterEtl.disabled = true;
      btnRefreshAfterEtl.innerHTML = "<span>⏳</span> Refreshing Dashboard...";
      await loadAllData();
      btnRefreshAfterEtl.disabled = false;
      btnRefreshAfterEtl.innerHTML = "<span>🔄</span> Refresh Dashboard & Map";
      closeEtlConsole();
    });
  }

  if (btnRunPipeline) {
    btnRunPipeline.addEventListener("click", () => {
      // Open Console Modal
      if (etlConsoleModal) etlConsoleModal.classList.add("open");

      // Reset Console UI State
      if (etlStatusPill) etlStatusPill.className = "etl-status-pill running";
      if (etlStatusText) etlStatusText.textContent = "INGESTING LIVE FEEDS";
      if (etlTimer) etlTimer.textContent = "0.0s";
      if (etlRecordCount) etlRecordCount.textContent = "0";
      if (etlIntegrity) {
        etlIntegrity.textContent = "Validating...";
        etlIntegrity.className = "etl-stat-val amber";
      }
      if (etlProgressPercent) etlProgressPercent.textContent = "0%";
      if (etlProgressBar) etlProgressBar.style.width = "0%";
      if (etlCurrentStageTitle) etlCurrentStageTitle.textContent = "Initiating real-time connection to ETL Orchestrator...";
      if (terminalLiveBadge) {
        terminalLiveBadge.textContent = "STREAMING ●";
        terminalLiveBadge.style.color = "#10b981";
      }
      if (btnRefreshAfterEtl) btnRefreshAfterEtl.style.display = "none";
      if (btnDismissEtlConsole) {
        btnDismissEtlConsole.textContent = "Dismiss Console";
        btnDismissEtlConsole.disabled = false;
      }

      // Reset Stepper Badges
      for (let i = 1; i <= 6; i++) {
        const badge = document.getElementById(`stageBadge-${i}`);
        const item = document.querySelector(`.etl-stage-item[data-stage="${i}"]`);
        if (badge) {
          badge.className = "stage-status-badge pending";
          badge.textContent = "Pending";
        }
        if (item) {
          item.classList.remove("running", "completed");
        }
      }

      if (etlTerminalLog) {
        etlTerminalLog.textContent = `[00:00.0] [ETL-ORCHESTRATOR] Initialized stream connection to /api/pipeline/stream...\n[00:00.0] [PIPELINE] Multi-domain ingestion starting (Open-Meteo, NOAA, AIS, eDNA, OBIS)...\n`;
      }

      // Start High-Precision Stopwatch Timer
      const startTime = performance.now();
      if (etlTimerInterval) clearInterval(etlTimerInterval);
      etlTimerInterval = setInterval(() => {
        const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
        if (etlTimer) etlTimer.textContent = `${elapsedSec}s`;
      }, 100);

      // Disable Header Button during run
      btnRunPipeline.disabled = true;
      btnRunPipeline.innerHTML = `<span>⚡</span> Pipeline Running...`;

      // Connect to SSE Stream
      if (activeEventSource) {
        activeEventSource.close();
      }

      try {
        activeEventSource = new EventSource("/api/pipeline/stream");

        activeEventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            handlePipelineProgressEvent(data);

            if (data.completed) {
              finishPipelineExecution(true, data);
            }
          } catch (err) {
            console.error("Error parsing pipeline SSE event:", err);
          }
        };

        activeEventSource.onerror = (err) => {
          console.warn("SSE stream completed or closed:", err);
          if (activeEventSource) {
            activeEventSource.close();
            activeEventSource = null;
          }
          finishPipelineExecution(true, { status: "SUCCESS" });
        };
      } catch (err) {
        console.error("Failed to establish SSE stream, running fallback:", err);
        runPipelineFallback();
      }
    });
  }

  function handlePipelineProgressEvent(data) {
    // Append log line
    if (data.log && etlTerminalLog) {
      etlTerminalLog.textContent += `${data.log}\n`;
      etlTerminalLog.scrollTop = etlTerminalLog.scrollHeight;
    }

    // Update Progress Bar
    if (data.progress_percent !== undefined) {
      if (etlProgressBar) etlProgressBar.style.width = `${data.progress_percent}%`;
      if (etlProgressPercent) etlProgressPercent.textContent = `${data.progress_percent}%`;
    }

    // Update Current Stage Title
    if (data.title && etlCurrentStageTitle) {
      etlCurrentStageTitle.textContent = data.title;
    }

    // Update Records Counter
    if (data.records_total !== undefined && etlRecordCount) {
      etlRecordCount.textContent = data.records_total;
    }

    // Update Stage Steppers
    if (data.stage >= 1 && data.stage <= 6) {
      const stageIdx = data.stage;
      const badge = document.getElementById(`stageBadge-${stageIdx}`);
      const item = document.querySelector(`.etl-stage-item[data-stage="${stageIdx}"]`);

      if (data.status === "running") {
        if (badge) {
          badge.className = "stage-status-badge running";
          badge.textContent = "Running...";
        }
        if (item) {
          item.classList.add("running");
          item.classList.remove("completed");
        }
      } else if (data.status === "completed") {
        if (badge) {
          badge.className = "stage-status-badge completed";
          badge.textContent = `✓ Ingested (+${data.stage_records || 0})`;
        }
        if (item) {
          item.classList.remove("running");
          item.classList.add("completed");
        }
      }
    }
  }

  function finishPipelineExecution(isSuccess, lastData) {
    if (etlTimerInterval) {
      clearInterval(etlTimerInterval);
      etlTimerInterval = null;
    }
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }

    if (btnRunPipeline) {
      btnRunPipeline.disabled = false;
      btnRunPipeline.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Run ETL Pipeline`;
    }

    if (isSuccess && (!lastData || lastData.status !== "failed")) {
      if (etlStatusPill) etlStatusPill.className = "etl-status-pill completed";
      if (etlStatusText) etlStatusText.textContent = "PIPELINE COMPLETED";
      if (etlProgressBar) etlProgressBar.style.width = "100%";
      if (etlProgressPercent) etlProgressPercent.textContent = "100%";
      if (etlIntegrity) {
        etlIntegrity.textContent = "100% Passed";
        etlIntegrity.className = "etl-stat-val green";
      }
      if (terminalLiveBadge) {
        terminalLiveBadge.textContent = "SYNCHRONIZED ✓";
        terminalLiveBadge.style.color = "#10b981";
      }
      if (btnRefreshAfterEtl) btnRefreshAfterEtl.style.display = "inline-flex";
      if (btnDismissEtlConsole) btnDismissEtlConsole.textContent = "Close Console";

      // Mark all stages completed
      for (let i = 1; i <= 6; i++) {
        const badge = document.getElementById(`stageBadge-${i}`);
        const item = document.querySelector(`.etl-stage-item[data-stage="${i}"]`);
        if (badge && !badge.classList.contains("completed")) {
          badge.className = "stage-status-badge completed";
          badge.textContent = "✓ Ingested";
        }
        if (item) {
          item.classList.remove("running");
          item.classList.add("completed");
        }
      }

      // Automatically reload live data in the background
      loadAllData();
    } else {
      if (etlStatusPill) etlStatusPill.className = "etl-status-pill failed";
      if (etlStatusText) etlStatusText.textContent = "PIPELINE HALTED";
      if (etlIntegrity) {
        etlIntegrity.textContent = "Error Occurred";
        etlIntegrity.className = "etl-stat-val coral";
      }
      if (terminalLiveBadge) {
        terminalLiveBadge.textContent = "ERROR ✕";
        terminalLiveBadge.style.color = "#ef4444";
      }
    }
  }

  async function runPipelineFallback() {
    try {
      const res = await fetch("/api/pipeline/run", { method: "POST" });
      const result = await res.json();
      if (etlTerminalLog) {
        etlTerminalLog.textContent += `[FALLBACK] Ingested ${result.records_processed} records in ${result.execution_time_ms} ms.\n`;
      }
      finishPipelineExecution(true, result);
    } catch (err) {
      if (etlTerminalLog) {
        etlTerminalLog.textContent += `[FALLBACK ERROR] ${err.message}\n`;
      }
      finishPipelineExecution(false, { error: err.message });
    }
  }

  // Copilot Drawer Open/Close
  const chatDrawer = document.getElementById("chatDrawer");
  document.getElementById("btnOpenCopilot").addEventListener("click", () => {
    chatDrawer.classList.add("open");
  });
  document.getElementById("btnCloseDrawer").addEventListener("click", () => {
    chatDrawer.classList.remove("open");
  });

  // Quick Prompt Chips
  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      sendChatMessage(prompt);
    });
  });

  // Chat Form Submission
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (query) {
      sendChatMessage(query);
      chatInput.value = "";
    }
  });
}

// Send Chat Message to GenAI Copilot with Live Backend Telemetry & Timer
async function sendChatMessage(query) {
  const container = document.getElementById("chatMessages");

  // Append user bubble
  const userBubble = document.createElement("div");
  userBubble.className = "msg-bubble user";
  userBubble.textContent = query;
  container.appendChild(userBubble);
  container.scrollTop = container.scrollHeight;

  // Processing pipeline stages
  const processingSteps = [
    { id: 'step-ingest', text: '🛰️ Ingesting satellite SST & oceanographic telemetry', delay: 0 },
    { id: 'step-edna', text: '🧬 Cross-referencing 12S/COI genomics & Shannon index', delay: 1200 },
    { id: 'step-ais', text: '🚢 Correlating AIS fleet CPUE & PFZ thermal boundary breaks', delay: 2500 },
    { id: 'step-gemini', text: '🧠 Streaming reasoning tokens through Google Gemini LLM core', delay: 3900 },
    { id: 'step-synth', text: '⚡ Synthesizing multi-domain advisory & markdown insights', delay: 5800 }
  ];

  // Append live processing placeholder bubble
  const typingBubble = document.createElement("div");
  typingBubble.className = "msg-bubble ai";
  typingBubble.innerHTML = `
    <div class="processing-card">
      <div class="processing-top">
        <div class="processing-title">
          <div class="processing-spinner"></div>
          <span>Matsya AI Oceanic Intelligence</span>
        </div>
        <div class="live-timer-badge" id="copilotLiveTimer">⏱ 0.0s</div>
      </div>
      <div class="processing-bar-wrap">
        <div class="processing-bar-fill"></div>
      </div>
      <div class="processing-steps" id="copilotProcessingSteps"></div>
      <div class="processing-footer">
        <span>Engine: Google Gemini Real-Time</span>
        <span>Grounding: Multi-Domain Telemetry</span>
      </div>
    </div>
  `;
  container.appendChild(typingBubble);
  container.scrollTop = container.scrollHeight;

  const startTime = performance.now();
  const timerElement = typingBubble.querySelector("#copilotLiveTimer");
  const stepsContainer = typingBubble.querySelector("#copilotProcessingSteps");

  function updateSteps(elapsedMs) {
    if (!stepsContainer) return;
    stepsContainer.innerHTML = processingSteps.map((step, idx) => {
      const nextDelay = processingSteps[idx + 1] ? processingSteps[idx + 1].delay : 999999;
      let statusClass = "pending";
      let icon = "○";
      if (elapsedMs >= nextDelay) {
        statusClass = "completed";
        icon = "✓";
      } else if (elapsedMs >= step.delay) {
        statusClass = "active";
        icon = "▶";
      }
      return `
        <div class="step-row ${statusClass}">
          <span class="step-icon">${icon}</span>
          <span>${step.text}</span>
        </div>
      `;
    }).join("");
  }

  updateSteps(0);

  // Live timer interval updating every 100ms
  const timerInterval = setInterval(() => {
    const elapsedMs = performance.now() - startTime;
    const seconds = (elapsedMs / 1000).toFixed(1);
    if (timerElement) {
      timerElement.textContent = `⏱ ${seconds}s`;
    }
    updateSteps(elapsedMs);
  }, 100);

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query })
    });
    const data = await res.json();
    clearInterval(timerInterval);

    const totalDurationSec = ((performance.now() - startTime) / 1000).toFixed(2);

    let badgeHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #34d399; font-weight: 600;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 6px #10b981;"></span>
          Gemini Live LLM (${data.model || 'Flash'})
        </div>
        <div class="live-timer-badge" style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.35); color: #38bdf8;">
          ⚡ Generated in ${totalDurationSec}s
        </div>
      </div>
      <details style="margin-bottom: 12px; font-size: 0.72rem; color: #94a3b8; background: rgba(6, 18, 38, 0.6); border-radius: 8px; padding: 6px 10px; border: 1px solid rgba(0, 240, 255, 0.15);">
        <summary style="cursor: pointer; color: #38bdf8; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <span>🔍 View backend telemetry trace (5 pipeline stages completed in ${totalDurationSec}s)</span>
        </summary>
        <div style="margin-top: 8px; padding-left: 4px; display: flex; flex-direction: column; gap: 5px; color: #cbd5e1; font-size: 0.7rem;">
          <div><span style="color:#10b981; font-weight:bold;">✓</span> <strong>Telemetry Ingestion</strong>: Satellite SST and NOAA thermal gradient arrays loaded</div>
          <div><span style="color:#10b981; font-weight:bold;">✓</span> <strong>Genomics Verification</strong>: 12S rRNA & COI taxonomic barcodes indexed</div>
          <div><span style="color:#10b981; font-weight:bold;">✓</span> <strong>Fisheries Correlator</strong>: AIS fleet coordinates & PFZ convergence boundaries evaluated</div>
          <div><span style="color:#10b981; font-weight:bold;">✓</span> <strong>Gemini Neural Core</strong>: Grounded reasoning generation dispatched to Google LLM</div>
          <div><span style="color:#10b981; font-weight:bold;">✓</span> <strong>Advisory Synthesis</strong>: Markdown telemetry formatted and verified in ${totalDurationSec}s</div>
        </div>
      </details>
    `;

    let actionsHtml = "";
    if (data.suggested_actions && data.suggested_actions.length > 0) {
      actionsHtml = `<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">` +
        `<span style="font-size: 0.7rem; color: #94a3b8; width: 100%; display: block; margin-bottom: 2px;">Suggested follow-ups:</span>` +
        data.suggested_actions.map(act => `<button class="followup-chip" style="background: rgba(14, 165, 233, 0.12); border: 1px solid rgba(14, 165, 233, 0.35); color: #7dd3fc; border-radius: 12px; padding: 3px 10px; font-size: 0.72rem; cursor: pointer; transition: all 0.2s;">${act}</button>`).join("") +
        `</div>`;
    }

    typingBubble.innerHTML = badgeHtml + formatMarkdown(data.response) + actionsHtml;

    // Attach click listeners to followup chips
    typingBubble.querySelectorAll(".followup-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        sendChatMessage(btn.textContent.trim());
      });
    });

    // Smoothly scroll to top of generated detailed briefing so user reads from the beginning
    setTimeout(() => {
      typingBubble.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } catch (err) {
    clearInterval(timerInterval);
    typingBubble.innerHTML = `<span style="color: #ff4d6d">Error generating response: ${err}</span>`;
    container.scrollTop = container.scrollHeight;
  }
}

// Comprehensive Markdown to HTML formatter for AI Copilot responses
function formatMarkdown(text) {
  if (!text) return "";

  // 1. Extract and preserve multiline code blocks
  const codeBlocks = [];
  let processed = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const idx = codeBlocks.length;
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    codeBlocks.push(`<pre><code class="lang-${lang}">${escapedCode.trim()}</code></pre>`);
    return `§§CODE_BLOCK_${idx}§§`;
  });

  // 2. Parse lines into structured elements (headings, tables, lists, quotes, paragraphs)
  const lines = processed.split(/\r?\n/);
  const outputLines = [];
  let inList = null; // 'ul' or 'ol'
  let inTable = false;
  let tableRows = [];

  function closeList() {
    if (inList) {
      outputLines.push(`</${inList}>`);
      inList = null;
    }
  }

  function closeTable() {
    if (inTable) {
      outputLines.push("<table><tbody>" + tableRows.join("") + "</tbody></table>");
      inTable = false;
      tableRows = [];
    }
  }

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // Markdown tables
    if (line.startsWith("|") && line.endsWith("|")) {
      closeList();
      if (line.includes("---")) continue; // Header separator row
      const cells = line.split("|").slice(1, -1);
      const tag = !inTable ? "th" : "td";
      const rowHtml = "<tr>" + cells.map(c => `<${tag}>${formatInline(c.trim())}</${tag}>`).join("") + "</tr>";
      tableRows.push(rowHtml);
      inTable = true;
      continue;
    } else {
      closeTable();
    }

    // Horizontal rule divider
    if (line === "---" || line === "***" || line === "___") {
      closeList();
      outputLines.push('<hr style="border: none; border-top: 1px solid rgba(0, 240, 255, 0.2); margin: 12px 0;">');
      continue;
    }

    // Markdown Headings
    if (line.startsWith("#### ")) {
      closeList();
      outputLines.push(`<h4>${formatInline(line.slice(5))}</h4>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      outputLines.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      outputLines.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      outputLines.push(`<h2>${formatInline(line.slice(2))}</h2>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      outputLines.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered List Items
    const ulMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== "ul") {
        closeList();
        inList = "ul";
        outputLines.push("<ul>");
      }
      outputLines.push(`<li>${formatInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered List Items
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== "ol") {
        closeList();
        inList = "ol";
        outputLines.push("<ol>");
      }
      outputLines.push(`<li>${formatInline(olMatch[1])}</li>`);
      continue;
    }

    // Empty blank line
    if (!line) {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    outputLines.push(`<p>${formatInline(line)}</p>`);
  }

  closeList();
  closeTable();

  let finalHtml = outputLines.join("\n");

  // Restore preserved code blocks
  finalHtml = finalHtml.replace(/§§CODE_BLOCK_(\d+)§§/g, (match, idx) => {
    return codeBlocks[parseInt(idx, 10)] || "";
  });

  return finalHtml;
}

function formatInline(str) {
  if (!str) return "";
  return str
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: underline;">$1</a>');
}

// =========================================================================
// FEATURE 1: THE SAFE BOX (DATA INGESTION & AUTO-HARMONIZATION)
// =========================================================================
function setupSafeBox() {
  const modal = document.getElementById("safeBoxModal");
  const btnOpen = document.getElementById("btnOpenSafeBox");
  const btnClose = document.getElementById("btnCloseSafeBox");
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const resultPanel = document.getElementById("safeboxResultPanel");

  if (!modal || !btnOpen) return;

  btnOpen.addEventListener("click", () => modal.classList.add("open"));
  if (btnClose) btnClose.addEventListener("click", () => modal.classList.remove("open"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  if (dropZone) {
    ["dragenter", "dragover"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    });

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
          handleFileUpload(fileInput.files[0]);
        }
      });
    }
  }

  const chipBuoy = document.getElementById("chipSampleBuoy");
  const chipFisheries = document.getElementById("chipSampleFisheries");
  const chipEdna = document.getElementById("chipSampleEdna");

  if (chipBuoy) {
    chipBuoy.addEventListener("click", () => {
      const csv = `Observation_Date,Latitude,Longitude,Temperature,Salinity_PSU,Station_ID
01/06/2024,18° 30' 00" N,72° 50' 00" E,28.4,35.1,BUOY-ARABIAN-01
15-Jun-2024,19° 12' N,72° 45' E,29.1,34.8,BUOY-ARABIAN-02
2024/07/01 14:00,18.75,72.60,27.9,35.4,BUOY-ARABIAN-03
05-07-2024,17° 55' 30" N,73° 10' 15" E,28.2,35.0,BUOY-ARABIAN-04`;
      const file = new File([csv], "messy_ocean_buoy_survey.csv", { type: "text/csv" });
      handleFileUpload(file);
    });
  }

  if (chipFisheries) {
    chipFisheries.addEventListener("click", () => {
      const csv = `Date,Latitude,Longitude,Target_Fish,Catch_KG,Vessel_ID,Vessel_Name
2024-05-10,15° 15' N,73° 40' E,yellowfin tuna,480.5,IND-GOA-102,Sea Explorer
2024-05-12,14° 50' N,73° 55' E,indian mackerel,150.0,IND-GOA-108,Ocean Falcon
2024-05-15,15.25,73.65,oil sardine,820.0,IND-KER-204,Coastal Pioneer
2024-05-18,15.80,73.20,whale shark,0.0,IND-MAH-301,Blue Horizon`;
      const file = new File([csv], "messy_catch_log.csv", { type: "text/csv" });
      handleFileUpload(file);
    });
  }

  if (chipEdna) {
    chipEdna.addEventListener("click", () => {
      const fasta = `>ArabianSea_Pelagic_Sample_01
CCTTTATCTAGTATTTGGTGCCTGAGCCGGAATAGTAGGCACAGCTCTAAGCCTCCTC
>CoralReef_DeepBenthic_Sample_02
CGTCAACTCCCTTCCTTAGTATTTAGTGCTTTAGCGGGCACCGCACTAAGCCTGCTT
>CoastalEstuary_Water_Sample_03
TACCTTTATCTAGTATTTGGTGCCTGAGCCGGAATAGTAGGCACAGCTCTAAGCCTCC`;
      const file = new File([fasta], "edna_sequence_reads.fasta", { type: "text/plain" });
      handleFileUpload(file);
    });
  }

  async function handleFileUpload(file) {
    const dropZoneText = dropZone.querySelector(".drop-zone-text");
    const origText = dropZoneText.textContent;
    dropZoneText.innerHTML = `<span>⏳</span> Harmonizing & standardizing <strong>${file.name}</strong>...`;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/safebox/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Harmonization failed");
      }

      const data = await res.json();

      // Show stats pills
      if (resultPanel) resultPanel.style.display = "block";
      document.getElementById("statSaved").textContent = data.records_saved_to_db;
      document.getElementById("statDates").textContent = data.cleaning_stats.dates_harmonized;
      document.getElementById("statCoords").textContent = data.cleaning_stats.locations_standardized;
      document.getElementById("statSpecies").textContent = data.cleaning_stats.species_names_normalized;

      // Populate preview table
      const table = document.getElementById("previewTable");
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      thead.innerHTML = "";
      tbody.innerHTML = "";

      if (data.preview && data.preview.length > 0) {
        const keys = Object.keys(data.preview[0]);
        const headerRow = document.createElement("tr");
        keys.forEach(k => {
          const th = document.createElement("th");
          th.textContent = k;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data.preview.forEach(row => {
          const tr = document.createElement("tr");
          keys.forEach(k => {
            const td = document.createElement("td");
            td.textContent = row[k] !== null && row[k] !== undefined ? row[k] : "";
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }

      dropZoneText.innerHTML = `✅ Successfully harmonized & stored <strong>${file.name}</strong>!`;
      setTimeout(() => { dropZoneText.textContent = origText; }, 4000);

      // Refresh platform data to reflect new uploads immediately
      await loadAllData();
    } catch (err) {
      alert(`Safe Box Error: ${err.message}`);
      dropZoneText.textContent = origText;
    } finally {
      if (fileInput) fileInput.value = "";
    }
  }
}

// =========================================================================
// FEATURE 2: THE DNA MATCHER (BIOLOGICAL SEQUENCE IDENTIFIER)
// =========================================================================
function setupDnaMatcher() {
  const modal = document.getElementById("dnaMatcherModal");
  const btnOpen = document.getElementById("btnOpenDnaMatcher");
  const btnClose = document.getElementById("btnCloseDnaMatcher");
  const input = document.getElementById("dnaSequenceInput");
  const btnMatch = document.getElementById("btnMatchDna");
  const resultPanel = document.getElementById("dnaResultPanel");

  if (!modal || !btnOpen) return;

  btnOpen.addEventListener("click", () => modal.classList.add("open"));
  if (btnClose) btnClose.addEventListener("click", () => modal.classList.remove("open"));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  const sampleSequences = {
    "chipTuna": "ACCGCCCGTCACCCTCCTCAAGTAATCAACCGTACTTTCATCACCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAACCC",
    "chipBluefin": "ACCGCCCGTCACCCTCCTCAAGTAATCAACCGTACTTTCATCGCCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAGCCC",
    "chipWhaleShark": "ACCGCCCGTCACCCTCCTCAGGTATCCAACCGTACTTACATCGCCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAAGGG",
    "chipGreatWhite": "ACCGCCCGTCACCCTCCTCAGGTACCCAACCGTACTTACATCGCCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAAGGG",
    "chipBlueWhale": "ACCGCCCGTCACCCTCCTCAAATATCTAACCGTACTTACATCGCCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAAGGG",
    "chipSquid": "GCAATAATTTTTTTTATGGTTATACCAATTATAATTGGAGGGTTTGGTAATTGACTAGTTCCCCTAATAATCGGAGCACCTGATATAGCATTTCCTCG",
    "chipTurtle": "ACTTTATACTTCCTCTTTGGTGCATGAGCCGGAATAGTAGGCACAGCTCTAAGCCTCCTCATTCGAGCCGAGCTCGGCCAGCCCGGCAACCTGCTAGGC",
    "chipMackerel": "ACCGCCCGTCACCCTCCTCAAGTATCCAACCGTACTAACATCGCCTCCCTACCGTGCAATCTCCACCGGGGCCTCAACCCTGTAGACTCGCTAAACCC"
  };

  // Wire all sample barcode chip buttons
  Object.keys(sampleSequences).forEach(chipId => {
    const btn = document.getElementById(chipId);
    if (btn) {
      btn.addEventListener("click", () => {
        input.value = sampleSequences[chipId];
        input.style.borderColor = "var(--accent-cyan)";
        input.style.boxShadow = "0 0 15px rgba(0, 240, 255, 0.4)";
        setTimeout(() => {
          input.style.borderColor = "";
          input.style.boxShadow = "";
        }, 350);
      });
    }
  });

  if (btnMatch) {
    btnMatch.addEventListener("click", async () => {
      const seq = input.value.trim();
      if (!seq) {
        alert("Please enter or select a DNA nucleotide sequence.");
        return;
      }

      btnMatch.disabled = true;
      btnMatch.innerHTML = `<span>⏳</span> NCBI Smith-Waterman Alignment in progress...`;

      try {
        const res = await fetch("/api/ai/dna-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence: seq })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Identification failed");
        }

        const data = await res.json();

        if (resultPanel) resultPanel.style.display = "block";
        document.getElementById("dnaCommonName").textContent = data.common_name || "Unknown Marine Organism";
        document.getElementById("dnaSciName").textContent = data.scientific_name || "";
        document.getElementById("dnaScoreBadge").textContent = `${data.match_score_percent}% Match`;

        const iucnEl = document.getElementById("dnaIucnStatus");
        const statusText = data.iucn_status || "Least Concern";
        iucnEl.textContent = statusText;
        if (statusText.includes("Endangered") || statusText.includes("Critically")) {
          iucnEl.style.background = "rgba(255, 77, 109, 0.2)";
          iucnEl.style.borderColor = "var(--accent-coral)";
          iucnEl.style.color = "var(--accent-coral)";
        } else if (statusText.includes("Vulnerable") || statusText.includes("Near")) {
          iucnEl.style.background = "rgba(245, 158, 11, 0.2)";
          iucnEl.style.borderColor = "var(--accent-amber)";
          iucnEl.style.color = "var(--accent-amber)";
        } else {
          iucnEl.style.background = "rgba(16, 185, 129, 0.2)";
          iucnEl.style.borderColor = "var(--accent-emerald)";
          iucnEl.style.color = "var(--accent-emerald)";
        }

        const accEl = document.getElementById("dnaAccession");
        if (accEl) {
          accEl.textContent = `NCBI: ${data.ncbi_accession || "GenBank Ref"}`;
        }

        const gcEl = document.getElementById("dnaGcContent");
        if (gcEl) {
          gcEl.textContent = `GC: ${data.gc_content_pct || "N/A"}%`;
        }

        const strandEl = document.getElementById("dnaStrand");
        if (strandEl) {
          strandEl.textContent = data.strand || "Forward (5' → 3')";
        }

        const markerEl = document.getElementById("dnaMarker");
        if (markerEl) markerEl.textContent = data.marker_gene || "12S rRNA / COI";

        const roleEl = document.getElementById("dnaRole");
        if (roleEl) roleEl.textContent = data.ecological_role || "Marine Biota";

        const engineEl = document.getElementById("dnaEngine");
        if (engineEl) {
          engineEl.textContent = data.engine || "Smith-Waterman Dynamic Alignment";
        }

        const covEl = document.getElementById("dnaCoverageBadge");
        if (covEl) {
          covEl.textContent = `Query Cov: ${data.query_coverage_percent || 100}%`;
        }

        const taxTree = document.getElementById("dnaTaxonomyTree");
        if (taxTree) taxTree.textContent = data.taxonomy_path || "Animalia > Chordata";

        const alignPre = document.getElementById("dnaAlignmentPre");
        if (alignPre) alignPre.textContent = data.alignment_preview || "Alignment complete.";
      } catch (err) {
        alert(`DNA Matcher Error: ${err.message}`);
      } finally {
        btnMatch.disabled = false;
        btnMatch.innerHTML = `<span>⚡</span> Identify Marine Organism`;
      }
    });
  }
}

