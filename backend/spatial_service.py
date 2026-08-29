"""
=============================================================================
GramPulse AI - Spatial & GIS Service (OpenStreetMap Nominatim & Overpass API)
=============================================================================
Provides live spatial geocoding, boundary polygon retrieval (GeoJSON),
reverse geocoding, and real-time infrastructure node querying for any
village, Gram Panchayat, town, or city in India.
=============================================================================
"""

import logging
import requests
from typing import Dict, List, Any, Optional

logger = logging.getLogger("GramPulse-Spatial")

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter"

# User-Agent required by OpenStreetMap Nominatim Usage Policy
HEADERS = {
    "User-Agent": "GramPulse-AI-RuralGovernance/1.0 (contact@grampulse.gov.in)",
    "Accept-Language": "en",
}

# In-memory cache for fast repeat lookups
_GEOCODE_CACHE: Dict[str, List[Dict[str, Any]]] = {}
_INFRASTRUCTURE_CACHE: Dict[str, Dict[str, Any]] = {}


def geocode_location_osm(
    query: str,
    state_hint: Optional[str] = None,
    limit: int = 8,
) -> List[Dict[str, Any]]:
    """
    Dynamically searches OpenStreetMap Nominatim API for any village, town, or city in India.
    Retrieves coordinates, boundary polygons (GeoJSON), and administrative hierarchy.
    """
    clean_q = query.strip()
    if not clean_q:
        return []

    cache_key = f"{clean_q.lower()}_{state_hint or ''}_{limit}"
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    # Format search query targeting India
    search_text = f"{clean_q}, India"
    if state_hint and state_hint.lower() not in clean_q.lower():
        search_text = f"{clean_q}, {state_hint}, India"

    params = {
        "q": search_text,
        "format": "jsonv2",
        "polygon_geojson": 1,
        "addressdetails": 1,
        "limit": limit,
        "countrycodes": "in",
    }

    try:
        response = requests.get(
            f"{NOMINATIM_BASE_URL}/search",
            params=params,
            headers=HEADERS,
            timeout=8.0,
        )
        response.raise_for_status()
        raw_results = response.json()

        parsed_results = []
        for idx, item in enumerate(raw_results):
            addr = item.get("address", {})
            name = (
                addr.get("village")
                or addr.get("town")
                or addr.get("hamlet")
                or addr.get("suburb")
                or addr.get("city")
                or addr.get("county")
                or item.get("name")
                or item.get("display_name", "").split(",")[0]
            )

            district = (
                addr.get("county")
                or addr.get("state_district")
                or addr.get("district")
                or addr.get("city_district")
                or "District"
            ).replace("District", "").strip()

            state = addr.get("state") or "India"
            lat = float(item.get("lat", 0.0))
            lon = float(item.get("lon", 0.0))
            boundingbox = item.get("boundingbox", [])
            geojson = item.get("geojson", None)

            # Generate stable synthetic GP ID for new dynamic locations
            osm_id = abs(int(item.get("osm_id", idx + 1000)))
            gp_id = 9000 + (osm_id % 90000)
            state_code = "".join([w[0].upper() for w in state.split()[:2]]) or "IN"
            dist_code = (district[:3].upper() if len(district) >= 3 else "DST")

            parsed_results.append({
                "gp_id": gp_id,
                "osm_id": osm_id,
                "gp_code": f"GP-{state_code}-{dist_code}-{gp_id % 1000:03d}",
                "gp_name": name,
                "district": district,
                "state": state,
                "display_name": item.get("display_name", ""),
                "lat": lat,
                "lng": lon,
                "type": item.get("type", "village"),
                "category": item.get("category", "place"),
                "boundingbox": boundingbox,
                "geojson": geojson,
                "is_live_osm": True,
            })

        _GEOCODE_CACHE[cache_key] = parsed_results
        return parsed_results

    except Exception as exc:
        logger.warning(f"OSM Nominatim geocoding error for '{query}': {exc}")
        return []


def reverse_geocode_osm(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """
    Reverse geocodes GPS coordinates into village, district, state, and pincode.
    """
    cache_key = f"rev_{round(lat, 4)}_{round(lng, 4)}"
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key][0] if _GEOCODE_CACHE[cache_key] else None

    params = {
        "lat": lat,
        "lon": lng,
        "format": "jsonv2",
        "addressdetails": 1,
        "polygon_geojson": 1,
    }

    try:
        response = requests.get(
            f"{NOMINATIM_BASE_URL}/reverse",
            params=params,
            headers=HEADERS,
            timeout=8.0,
        )
        response.raise_for_status()
        item = response.json()
        addr = item.get("address", {})

        name = (
            addr.get("village")
            or addr.get("town")
            or addr.get("hamlet")
            or addr.get("suburb")
            or addr.get("city")
            or item.get("name")
            or "Habitation"
        )
        district = (
            addr.get("county")
            or addr.get("state_district")
            or addr.get("district")
            or "District"
        ).replace("District", "").strip()

        state = addr.get("state", "India")
        osm_id = abs(int(item.get("osm_id", 1000)))
        gp_id = 9000 + (osm_id % 90000)

        result = {
            "gp_id": gp_id,
            "osm_id": osm_id,
            "gp_code": f"GP-REV-{gp_id % 1000:03d}",
            "gp_name": name,
            "district": district,
            "state": state,
            "lat": lat,
            "lng": lng,
            "display_name": item.get("display_name", ""),
            "geojson": item.get("geojson", None),
            "is_live_osm": True,
        }
        _GEOCODE_CACHE[cache_key] = [result]
        return result

    except Exception as exc:
        logger.warning(f"OSM reverse geocoding error ({lat}, {lng}): {exc}")
        return None


def fetch_village_infrastructure_overpass(
    lat: float,
    lng: float,
    radius_meters: int = 3500,
) -> Dict[str, Any]:
    """
    Executes live Overpass API query around a village center coordinate to extract
    real-world infrastructure nodes:
    - Drinking Water: water wells, hand pumps, water towers, water works
    - Education: primary/secondary schools, kindergartens, colleges
    - Healthcare: hospitals, clinics, pharmacies
    - Roads & Transport: primary, secondary, tertiary, residential highways, bus stops
    - Sanitation & SLWM: waste disposal, recycling, public toilets
    """
    cache_key = f"infra_{round(lat, 3)}_{round(lng, 3)}_{radius_meters}"
    if cache_key in _INFRASTRUCTURE_CACHE:
        return _INFRASTRUCTURE_CACHE[cache_key]

    # Overpass QL Query for comprehensive rural infrastructure
    overpass_query = f"""
    [out:json][timeout:15];
    (
      // Water infrastructure
      node["amenity"="drinking_water"](around:{radius_meters},{lat},{lng});
      node["man_made"="water_well"](around:{radius_meters},{lat},{lng});
      node["man_made"="water_tap"](around:{radius_meters},{lat},{lng});
      node["man_made"="water_tower"](around:{radius_meters},{lat},{lng});
      node["man_made"="water_works"](around:{radius_meters},{lat},{lng});

      // Education infrastructure
      node["amenity"="school"](around:{radius_meters},{lat},{lng});
      way["amenity"="school"](around:{radius_meters},{lat},{lng});
      node["amenity"="kindergarten"](around:{radius_meters},{lat},{lng});
      node["amenity"="college"](around:{radius_meters},{lat},{lng});

      // Healthcare
      node["amenity"="hospital"](around:{radius_meters},{lat},{lng});
      node["amenity"="clinic"](around:{radius_meters},{lat},{lng});
      node["amenity"="pharmacy"](around:{radius_meters},{lat},{lng});

      // Roads & Transport
      node["highway"="bus_stop"](around:{radius_meters},{lat},{lng});
      way["highway"~"primary|secondary|tertiary|unclassified|residential"](around:{radius_meters},{lat},{lng});

      // Sanitation & SLWM
      node["amenity"="waste_disposal"](around:{radius_meters},{lat},{lng});
      node["amenity"="recycling"](around:{radius_meters},{lat},{lng});
      node["amenity"="toilets"](around:{radius_meters},{lat},{lng});
    );
    out center tags;
    """

    try:
        response = requests.post(
            OVERPASS_BASE_URL,
            data={"data": overpass_query},
            headers=HEADERS,
            timeout=12.0,
        )
        response.raise_for_status()
        data = response.json()
        elements = data.get("elements", [])

        water_points = []
        schools = []
        healthcare = []
        sanitation_nodes = []
        road_segments_count = 0
        total_road_est_km = 0.0

        for elem in elements:
            tags = elem.get("tags", {})
            elem_lat = elem.get("lat") or (elem.get("center", {}).get("lat"))
            elem_lng = elem.get("lon") or (elem.get("center", {}).get("lon"))

            if not elem_lat or not elem_lng:
                continue

            amenity = tags.get("amenity", "")
            man_made = tags.get("man_made", "")
            highway = tags.get("highway", "")

            # Classify Water Nodes
            if (
                amenity == "drinking_water"
                or man_made in ["water_well", "water_tap", "water_tower", "water_works"]
            ):
                water_points.append({
                    "id": elem.get("id"),
                    "type": "water",
                    "subtype": man_made or amenity,
                    "name": tags.get("name", "Public Water Supply Point"),
                    "lat": elem_lat,
                    "lng": elem_lng,
                })

            # Classify Education
            elif amenity in ["school", "kindergarten", "college"]:
                schools.append({
                    "id": elem.get("id"),
                    "type": "education",
                    "subtype": amenity,
                    "name": tags.get("name", "Government / Village School"),
                    "lat": elem_lat,
                    "lng": elem_lng,
                })

            # Classify Healthcare
            elif amenity in ["hospital", "clinic", "pharmacy"]:
                healthcare.append({
                    "id": elem.get("id"),
                    "type": "healthcare",
                    "subtype": amenity,
                    "name": tags.get("name", "Primary Health Centre (PHC)"),
                    "lat": elem_lat,
                    "lng": elem_lng,
                })

            # Classify Sanitation
            elif amenity in ["waste_disposal", "recycling", "toilets"]:
                sanitation_nodes.append({
                    "id": elem.get("id"),
                    "type": "sanitation",
                    "subtype": amenity,
                    "name": tags.get("name", "Sanitation & Waste Facility"),
                    "lat": elem_lat,
                    "lng": elem_lng,
                })

            # Classify Roads
            if highway and highway != "bus_stop":
                road_segments_count += 1
                total_road_est_km += 0.45  # Approx average segment length

        summary = {
            "center": {"lat": lat, "lng": lng},
            "radius_meters": radius_meters,
            "counts": {
                "water_points": len(water_points),
                "schools": len(schools),
                "healthcare": len(healthcare),
                "sanitation_nodes": len(sanitation_nodes),
                "road_segments": road_segments_count,
                "estimated_road_network_km": round(total_road_est_km, 2),
            },
            "markers": water_points + schools + healthcare + sanitation_nodes,
        }

        _INFRASTRUCTURE_CACHE[cache_key] = summary
        return summary

    except Exception as exc:
        logger.warning(f"Overpass API query error around ({lat}, {lng}): {exc}")
        return {
            "center": {"lat": lat, "lng": lng},
            "radius_meters": radius_meters,
            "counts": {
                "water_points": 0,
                "schools": 0,
                "healthcare": 0,
                "sanitation_nodes": 0,
                "road_segments": 0,
                "estimated_road_network_km": 0.0,
            },
            "markers": [],
        }
