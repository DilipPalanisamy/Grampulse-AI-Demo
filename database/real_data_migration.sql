
-- GramPulse AI: Real-data metadata migration

-- 1. Add official administrative identifier
ALTER TABLE gram_panchayats
ADD COLUMN IF NOT EXISTS lgd_code VARCHAR(50);

-- 2. Add geographic coordinates
ALTER TABLE gram_panchayats
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE gram_panchayats
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. Add data-source metadata
ALTER TABLE village_metrics
ADD COLUMN IF NOT EXISTS data_source TEXT;

ALTER TABLE village_metrics
ADD COLUMN IF NOT EXISTS source_year SMALLINT;

ALTER TABLE village_metrics
ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE village_metrics
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30)
DEFAULT 'UNVERIFIED';

-- 4. Allow unavailable metrics
ALTER TABLE village_metrics
ALTER COLUMN population DROP NOT NULL;

ALTER TABLE village_metrics
ALTER COLUMN households DROP NOT NULL;

ALTER TABLE village_metrics
ALTER COLUMN daily_water_supply_liters DROP NOT NULL;

ALTER TABLE village_metrics
ALTER COLUMN school_classrooms_count DROP NOT NULL;

ALTER TABLE village_metrics
ALTER COLUMN road_coverage_km DROP NOT NULL;

-- 5. Add verification status constraint
ALTER TABLE village_metrics
ADD CONSTRAINT village_metrics_verification_status_check
CHECK (
    verification_status IN (
        'VERIFIED',
        'UNVERIFIED',
        'ESTIMATED',
        'DEMO'
    )
);

-- 6. Official Panchayat identifier index
CREATE UNIQUE INDEX IF NOT EXISTS
idx_gram_panchayats_lgd_code
ON gram_panchayats(lgd_code)
WHERE lgd_code IS NOT NULL;
