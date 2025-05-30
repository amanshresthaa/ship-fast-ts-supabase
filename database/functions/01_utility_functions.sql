-- Utility Functions
-- This file contains utility functions used throughout the database

-- ------------------------------------------------------------------
-- TIMESTAMP TRIGGER FUNCTION
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
