-- =============================================================================
-- GramPulse AI - Database Schema (PostgreSQL + PostGIS)
-- Description: Core schema for rural governance analytics, demographic census
--              metrics, and geotagged citizen issue tracking.
-- =============================================================================

-- Ensure PostGIS spatial extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Table: gram_panchayats
-- Description: Administrative master table storing Gram Panchayat entities.
-- =============================================================================
CREATE TABLE IF NOT EXISTS gram_panchayats (
    gp_id SERIAL PRIMARY KEY,
    gp_code VARCHAR(50) NOT NULL UNIQUE,
    gp_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gram_panchayats IS 'Master directory of Gram Panchayats across states and districts';
COMMENT ON COLUMN gram_panchayats.gp_id IS 'Unique serial identifier for the Gram Panchayat';
COMMENT ON COLUMN gram_panchayats.gp_code IS 'Unique government/system alphanumeric code for the Gram Panchayat';
COMMENT ON COLUMN gram_panchayats.gp_name IS 'Official name of the Gram Panchayat';
COMMENT ON COLUMN gram_panchayats.district IS 'District name in which the Gram Panchayat resides';
COMMENT ON COLUMN gram_panchayats.state IS 'State/UT name in which the Gram Panchayat resides';

-- =============================================================================
-- Table: village_metrics
-- Description: Historical census and infrastructure metrics per Gram Panchayat.
-- =============================================================================
CREATE TABLE IF NOT EXISTS village_metrics (
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

COMMENT ON TABLE village_metrics IS 'Annual demographic, education, utility, and road infrastructure metrics per GP';
COMMENT ON COLUMN village_metrics.record_year IS 'Census / Reporting year for the data record';
COMMENT ON COLUMN village_metrics.daily_water_supply_liters IS 'Average daily potable water distributed in liters';
COMMENT ON COLUMN village_metrics.school_classrooms_count IS 'Functional primary/secondary school classroom count';
COMMENT ON COLUMN village_metrics.road_coverage_km IS 'Total paved and unpaved road network length in kilometers';

-- =============================================================================
-- Table: citizen_issues
-- Description: Geotagged civic grievances, infrastructure reports, and issues.
-- =============================================================================
CREATE TABLE IF NOT EXISTS citizen_issues (
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

COMMENT ON TABLE citizen_issues IS 'Grievances and civic issues submitted by citizens with GPS coordinates';
COMMENT ON COLUMN citizen_issues.location IS 'Spatial point geometry (SRID 4326: WGS 84 coordinate system [Longitude, Latitude])';
COMMENT ON COLUMN citizen_issues.status IS 'Lifecycle state: OPEN, IN_PROGRESS, RESOLVED, REJECTED';

-- =============================================================================
-- Production Indexes for High-Performance Queries & Spatial Filtering
-- =============================================================================

-- Foreign key indexes to optimize JOIN operations
CREATE INDEX IF NOT EXISTS idx_village_metrics_gp_id ON village_metrics(gp_id);
CREATE INDEX IF NOT EXISTS idx_citizen_issues_gp_id ON citizen_issues(gp_id);

-- Filter & aggregation indexes
CREATE INDEX IF NOT EXISTS idx_village_metrics_year ON village_metrics(record_year);
CREATE INDEX IF NOT EXISTS idx_citizen_issues_status ON citizen_issues(status);
CREATE INDEX IF NOT EXISTS idx_citizen_issues_category ON citizen_issues(category);
CREATE INDEX IF NOT EXISTS idx_citizen_issues_created_at ON citizen_issues(created_at DESC);

-- PostGIS Spatial Index (GIST) for rapid bounding-box and radius proximity queries
CREATE INDEX IF NOT EXISTS idx_citizen_issues_location_gist ON citizen_issues USING GIST (location);

-- =============================================================================
-- Helper Functions & Trigger for Automatic updated_at Timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gram_panchayats_updated_at ON gram_panchayats;
CREATE TRIGGER trg_gram_panchayats_updated_at
    BEFORE UPDATE ON gram_panchayats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_citizen_issues_updated_at ON citizen_issues;
CREATE TRIGGER trg_citizen_issues_updated_at
    BEFORE UPDATE ON citizen_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
