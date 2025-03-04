-- Migration to add unit_number column to vehicles table
ALTER TABLE vehicles ADD COLUMN unit_number VARCHAR(50);

-- Update existing vehicles to set unit_number from Samsara name if available
UPDATE vehicles 
SET unit_number = (
    SELECT name 
    FROM samsara_vehicles 
    WHERE samsara_vehicles.samsara_id = vehicles.samsara_id
    LIMIT 1
)
WHERE samsara_id IS NOT NULL;

-- Create an index on unit_number for faster lookups
CREATE INDEX idx_vehicles_unit_number ON vehicles(unit_number);
