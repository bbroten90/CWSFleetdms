-- Add location tracking to vehicles table
ALTER TABLE vehicles ADD COLUMN last_latitude REAL;
ALTER TABLE vehicles ADD COLUMN last_longitude REAL;
ALTER TABLE vehicles ADD COLUMN last_location_address TEXT;
ALTER TABLE vehicles ADD COLUMN last_location_updated_at DATETIME;

-- Add system_config table for application settings
CREATE TABLE IF NOT EXISTS system_config (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT NOT NULL, 
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add initial config values
INSERT INTO system_config (config_key, config_value, description) 
VALUES ('samsara_sync_interval', '30', 'Interval in minutes between Samsara automatic syncs');
