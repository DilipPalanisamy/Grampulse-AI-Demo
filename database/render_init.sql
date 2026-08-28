-- =============================================================================
-- GramPulse AI - PostgreSQL + PostGIS Initialization Script for Render
-- Description: Enables PostGIS, builds relational schema, and seeds realistic
--              demographic metrics & geotagged citizen grievances.
-- =============================================================================

-- 1. Enable PostGIS and UUID Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables for a clean start if required
DROP TABLE IF EXISTS citizen_issues CASCADE;
DROP TABLE IF EXISTS village_metrics CASCADE;
DROP TABLE IF EXISTS gram_panchayats CASCADE;

-- -----------------------------------------------------------------------------
-- Table: gram_panchayats
-- -----------------------------------------------------------------------------
CREATE TABLE gram_panchayats (
    gp_id SERIAL PRIMARY KEY,
    gp_code VARCHAR(50) NOT NULL UNIQUE,
    gp_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    center_location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- Table: village_metrics
-- -----------------------------------------------------------------------------
CREATE TABLE village_metrics (
    metric_id SERIAL PRIMARY KEY,
    gp_id INTEGER NOT NULL REFERENCES gram_panchayats(gp_id) ON DELETE CASCADE,
    record_year SMALLINT NOT NULL CHECK (record_year >= 1990 AND record_year <= 2100),
    population INTEGER NOT NULL CHECK (population >= 0),
    households INTEGER NOT NULL CHECK (households >= 0),
    daily_water_supply_liters NUMERIC(12, 2) NOT NULL CHECK (daily_water_supply_liters >= 0),
    school_classrooms_count INTEGER NOT NULL CHECK (school_classrooms_count >= 0),
    road_coverage_km NUMERIC(8, 2) NOT NULL CHECK (road_coverage_km >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_gp_record_year UNIQUE (gp_id, record_year)
);

-- -----------------------------------------------------------------------------
-- Table: citizen_issues
-- -----------------------------------------------------------------------------
CREATE TABLE citizen_issues (
    issue_id SERIAL PRIMARY KEY,
    gp_id INTEGER NOT NULL REFERENCES gram_panchayats(gp_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (
        category IN (
            'Water Supply',
            'Roads & Infrastructure',
            'Sanitation',
            'Electricity',
            'Education',
            'Healthcare',
            'Agriculture',
            'Public Transport',
            'Other'
        )
    ),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')
    ),
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- Production Spatial and Relational Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_village_metrics_gp_id ON village_metrics(gp_id);
CREATE INDEX idx_citizen_issues_gp_id ON citizen_issues(gp_id);
CREATE INDEX idx_citizen_issues_status ON citizen_issues(status);
CREATE INDEX idx_citizen_issues_category ON citizen_issues(category);
CREATE INDEX idx_citizen_issues_location_gist ON citizen_issues USING GIST (location);
CREATE INDEX idx_panchayats_location_gist ON gram_panchayats USING GIST (center_location);

-- -----------------------------------------------------------------------------
-- Seed Data: Model Gram Panchayats (Tamil Nadu & National)
-- -----------------------------------------------------------------------------
INSERT INTO gram_panchayats (gp_id, gp_code, gp_name, district, state, center_location) VALUES
(1, 'GP-MH-AHM-001', 'Hiware Bazar', 'Ahmednagar', 'Maharashtra', ST_SetSRID(ST_MakePoint(74.9252, 19.0435), 4326)),
(2, 'GP-GJ-SAB-002', 'Punsari', 'Sabarkantha', 'Gujarat', ST_SetSRID(ST_MakePoint(73.1812, 23.4988), 4326)),
(3, 'GP-ML-EKH-003', 'Mawlynnong', 'East Khasi Hills', 'Meghalaya', ST_SetSRID(ST_MakePoint(91.9056, 25.2016), 4326)),
(4, 'GP-TN-CBE-004', 'Odanthurai', 'Coimbatore', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(76.9366, 11.2982), 4326)),
(5, 'GP-RJ-RAJ-005', 'Piplantri', 'Rajsamand', 'Rajasthan', ST_SetSRID(ST_MakePoint(73.8644, 25.0483), 4326)),
(6, 'GP-TN-TRV-006', 'Kuthambakkam', 'Tiruvallur', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(80.0076, 13.0645), 4326)),
(7, 'GP-TN-SVG-007', 'Keeladi', 'Sivagangai', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(78.1884, 9.8647), 4326)),
(8, 'GP-TN-THJ-008', 'Thiruvaiyaru', 'Thanjavur', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(79.1039, 10.8794), 4326)),
(9, 'GP-TN-KNC-009', 'Uthiramerur', 'Kanchipuram', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(79.7610, 12.6321), 4326)),
(10, 'GP-TN-TNL-010', 'Papanasam', 'Tirunelveli', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(77.3712, 8.7088), 4326)),
(11, 'GP-TN-ERD-011', 'Punjaipuliampatti', 'Erode', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(77.1720, 11.3540), 4326)),
(12, 'GP-TN-NIL-012', 'Hubbathalai', 'The Nilgiris', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(76.7959, 11.3530), 4326)),
(13, 'GP-TN-SVG-013', 'Kanadukathan', 'Sivagangai', 'Tamil Nadu', ST_SetSRID(ST_MakePoint(78.7844, 10.1770), 4326));

-- Reset serial sequence
SELECT setval('gram_panchayats_gp_id_seq', (SELECT MAX(gp_id) FROM gram_panchayats));

-- -----------------------------------------------------------------------------
-- Seed Data: Census & Infrastructure Metrics
-- -----------------------------------------------------------------------------
INSERT INTO village_metrics (gp_id, record_year, population, households, daily_water_supply_liters, school_classrooms_count, road_coverage_km) VALUES
-- Punsari (Gujarat) - Historical + 2024
(2, 2011, 4800, 920, 180000.0, 20, 18.0),
(2, 2016, 5450, 1040, 225000.0, 24, 23.5),
(2, 2021, 6100, 1160, 270000.0, 28, 27.0),
(2, 2024, 6450, 1220, 290000.0, 30, 29.5),

-- Odanthurai (Tamil Nadu)
(4, 2011, 5100, 1150, 280000.0, 24, 22.0),
(4, 2016, 5900, 1320, 340000.0, 28, 28.0),
(4, 2021, 6500, 1460, 400000.0, 32, 32.5),
(4, 2024, 6820, 1530, 430000.0, 34, 34.8),

-- Hiware Bazar (Maharashtra)
(1, 2024, 1365, 250, 85000.0, 14, 18.5),

-- Mawlynnong (Meghalaya)
(3, 2024, 535, 102, 35000.0, 9, 11.5),

-- Piplantri (Rajasthan)
(5, 2024, 4610, 870, 210000.0, 22, 23.5),

-- Kuthambakkam (Tamil Nadu)
(6, 2024, 5420, 1180, 310000.0, 26, 24.2),

-- Keeladi (Tamil Nadu)
(7, 2024, 4150, 920, 245000.0, 18, 19.5),

-- Thiruvaiyaru (Tamil Nadu)
(8, 2024, 7290, 1640, 490000.0, 36, 38.0),

-- Uthiramerur (Tamil Nadu)
(9, 2024, 8410, 1890, 520000.0, 42, 41.5),

-- Papanasam (Tamil Nadu)
(10, 2024, 4890, 1060, 360000.0, 24, 22.0),

-- Punjaipuliampatti (Tamil Nadu)
(11, 2024, 6150, 1390, 380000.0, 28, 31.5),

-- Hubbathalai (The Nilgiris)
(12, 2024, 3840, 880, 220000.0, 16, 17.5),

-- Kanadukathan (Tamil Nadu)
(13, 2024, 4520, 990, 270000.0, 20, 26.0);

-- -----------------------------------------------------------------------------
-- Seed Data: Geotagged Citizen Grievances
-- -----------------------------------------------------------------------------
INSERT INTO citizen_issues (gp_id, category, description, status, location) VALUES
-- Odanthurai (Tamil Nadu)
(4, 'Water Supply', 'Solar powered pump inverter tripping during morning high-demand hours in South Ward.', 'OPEN', ST_SetSRID(ST_MakePoint(76.9366, 11.2982), 4326)),
(4, 'Education', 'Panchayat Union Middle School smart classroom power backup battery requires maintenance.', 'OPEN', ST_SetSRID(ST_MakePoint(76.9390, 11.3005), 4326)),

-- Punsari (Gujarat)
(2, 'Water Supply', 'Primary community borewell motor damaged near North Hamlet; drinking water unavailable for 3 days.', 'OPEN', ST_SetSRID(ST_MakePoint(73.1812, 23.4988), 4326)),
(2, 'Roads & Infrastructure', 'Potholes along the main agricultural market link road connecting to state highway 14.', 'IN_PROGRESS', ST_SetSRID(ST_MakePoint(73.1845, 23.5012), 4326)),
(2, 'Sanitation', 'Underground drainage blockage causing overflow near Community Health Centre.', 'OPEN', ST_SetSRID(ST_MakePoint(73.1780, 23.4960), 4326)),
(2, 'Education', 'Punsari Primary School digital smart-board projector malfunctioning in Room 3.', 'RESOLVED', ST_SetSRID(ST_MakePoint(73.1820, 23.4975), 4326)),

-- Kuthambakkam (Tamil Nadu)
(6, 'Water Supply', 'Community solar RO plant membrane filtration unit needs scheduled servicing for Ward 2.', 'OPEN', ST_SetSRID(ST_MakePoint(80.0076, 13.0645), 4326)),
(6, 'Roads & Infrastructure', 'Eco-stabilized paver block lane connecting weavers cooperative requires realignment.', 'IN_PROGRESS', ST_SetSRID(ST_MakePoint(80.0095, 13.0665), 4326)),

-- Keeladi (Tamil Nadu)
(7, 'Sanitation', 'Heritage Museum tourist parking zone requires additional bio-digester toilet maintenance.', 'OPEN', ST_SetSRID(ST_MakePoint(78.1884, 9.8647), 4326)),
(7, 'Water Supply', 'Vaigai river feeder channel sub-canal sluice gate jammed with debris near South Hamlet.', 'IN_PROGRESS', ST_SetSRID(ST_MakePoint(78.1910, 9.8670), 4326)),

-- Thiruvaiyaru (Tamil Nadu)
(8, 'Roads & Infrastructure', 'Cauvery river bund connecting road damaged near Samadhi Ghat during recent seasonal discharge.', 'OPEN', ST_SetSRID(ST_MakePoint(79.1039, 10.8794), 4326)),

-- Uthiramerur (Tamil Nadu)
(9, 'Water Supply', 'Ancient irrigation eri tank feeder channel requires desilting before monsoon filling.', 'OPEN', ST_SetSRID(ST_MakePoint(79.7610, 12.6321), 4326)),

-- Papanasam (Tamil Nadu)
(10, 'Water Supply', 'Thamirabarani river pump station intake well screen clogged by natural riverbed silt.', 'OPEN', ST_SetSRID(ST_MakePoint(77.3712, 8.7088), 4326)),

-- Hubbathalai (The Nilgiris)
(12, 'Roads & Infrastructure', 'Hill road hairpin bend #4 retaining wall damaged by mountain landslide runoff.', 'IN_PROGRESS', ST_SetSRID(ST_MakePoint(76.7959, 11.3530), 4326));
