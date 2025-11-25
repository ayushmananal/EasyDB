-- Create tables for datasets
-- Run this on AlloyDB to create the table structures

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tesla_deliveries CASCADE;
DROP TABLE IF EXISTS housing_prices CASCADE;
DROP TABLE IF EXISTS israel_palestine_trade CASCADE;

-- Tesla Deliveries Data
CREATE TABLE tesla_deliveries (
  id SERIAL PRIMARY KEY,
  year INTEGER,
  month INTEGER,
  region VARCHAR(100),
  model VARCHAR(50),
  estimated_deliveries INTEGER,
  production_units INTEGER,
  avg_price_usd NUMERIC(12, 2),
  battery_capacity_kwh INTEGER,
  range_km INTEGER,
  co2_saved_tons NUMERIC(10, 2),
  source_type VARCHAR(100),
  charging_stations INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Housing Prices Data
CREATE TABLE housing_prices (
  id SERIAL PRIMARY KEY,
  price BIGINT,
  area INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  stories INTEGER,
  mainroad VARCHAR(10),
  guestroom VARCHAR(10),
  basement VARCHAR(10),
  hotwaterheating VARCHAR(10),
  airconditioning VARCHAR(10),
  parking INTEGER,
  prefarea VARCHAR(10),
  furnishingstatus VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Israel-Palestine Trade and Conflict Data
CREATE TABLE israel_palestine_trade (
  id SERIAL PRIMARY KEY,
  country_name_israel VARCHAR(200),
  country_iso3 VARCHAR(20),
  year INTEGER,
  indicator_name TEXT,
  indicator_code VARCHAR(100),
  value_finally_israel TEXT,
  id_palestine_numbers BIGINT,
  country VARCHAR(200),
  iso3 VARCHAR(20),
  latitude TEXT,
  longitude TEXT,
  centroid TEXT,
  role VARCHAR(200),
  displacement_type VARCHAR(200),
  qualifier VARCHAR(200),
  figure TEXT,
  displacement_date VARCHAR(200),
  displacement_start_date VARCHAR(200),
  displacement_end_date VARCHAR(200),
  year_displacement INTEGER,
  event_id BIGINT,
  event_name TEXT,
  event_start_date VARCHAR(200),
  event_end_date VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tesla_year ON tesla_deliveries(year);
CREATE INDEX IF NOT EXISTS idx_tesla_region ON tesla_deliveries(region);
CREATE INDEX IF NOT EXISTS idx_tesla_model ON tesla_deliveries(model);

CREATE INDEX IF NOT EXISTS idx_housing_price ON housing_prices(price);
CREATE INDEX IF NOT EXISTS idx_housing_bedrooms ON housing_prices(bedrooms);

CREATE INDEX IF NOT EXISTS idx_israel_palestine_year ON israel_palestine_trade(year);
CREATE INDEX IF NOT EXISTS idx_israel_palestine_country ON israel_palestine_trade(country);
