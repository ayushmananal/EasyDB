import fs from 'fs';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to parse CSV manually (handles commas in quotes)
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || null;
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

// Import Tesla data
async function importTesla() {
  console.log('\n Importing Tesla Deliveries data...');
  
  const fileContent = fs.readFileSync('../public/data/tesla.csv', 'utf-8');
  const { rows } = parseCSV(fileContent);
  
  console.log(`   Found ${rows.length} rows`);
  
  let imported = 0;
  for (const row of rows) {
    try {
      await pool.query(`
        INSERT INTO tesla_deliveries (
          year, month, region, model, estimated_deliveries, 
          production_units, avg_price_usd, battery_capacity_kwh, 
          range_km, co2_saved_tons, source_type, charging_stations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        parseInt(row.Year) || null,
        parseInt(row.Month) || null,
        row.Region,
        row.Model,
        parseInt(row.Estimated_Deliveries) || null,
        parseInt(row.Production_Units) || null,
        parseFloat(row.Avg_Price_USD) || null,
        parseInt(row.Battery_Capacity_kWh) || null,
        parseInt(row.Range_km) || null,
        parseFloat(row.CO2_Saved_tons) || null,
        row.Source_Type,
        parseInt(row.Charging_Stations) || null
      ]);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Imported ${imported}/${rows.length} rows...`);
      }
    } catch (error) {
      console.error(`   Error importing Tesla row:`, error.message);
    }
  }
  
  console.log(`Tesla data imported: ${imported} rows`);
}

// Import Housing data
async function importHousing() {
  console.log('\n Importing Housing Prices data...');
  
  const fileContent = fs.readFileSync('../public/data/housing.csv', 'utf-8');
  const { rows } = parseCSV(fileContent);
  
  console.log(`   Found ${rows.length} rows`);
  
  let imported = 0;
  for (const row of rows) {
    try {
      await pool.query(`
        INSERT INTO housing_prices (
          price, area, bedrooms, bathrooms, stories, 
          mainroad, guestroom, basement, hotwaterheating, 
          airconditioning, parking, prefarea, furnishingstatus
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        parseInt(row.price) || null,
        parseInt(row.area) || null,
        parseInt(row.bedrooms) || null,
        parseInt(row.bathrooms) || null,
        parseInt(row.stories) || null,
        row.mainroad,
        row.guestroom,
        row.basement,
        row.hotwaterheating,
        row.airconditioning,
        parseInt(row.parking) || null,
        row.prefarea,
        row.furnishingstatus
      ]);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Imported ${imported}/${rows.length} rows...`);
      }
    } catch (error) {
      console.error(`   Error importing Housing row:`, error.message);
    }
  }
  
  console.log(`Housing data imported: ${imported} rows`);
}

// Import Israel-Palestine data
async function importIsraelPalestine() {
  console.log('\n Importing Israel-Palestine Trade data...');
  
  const fileContent = fs.readFileSync('../public/data/israel-palestine.csv', 'utf-8');
  const { rows } = parseCSV(fileContent);
  
  console.log(`   Found ${rows.length} rows`);
  
  let imported = 0;
  for (const row of rows) {
    try {
      await pool.query(`
        INSERT INTO israel_palestine_trade (
          country_name_israel, country_iso3, year, indicator_name, 
          indicator_code, value_finally_israel, id_palestine_numbers, 
          country, iso3, latitude, longitude, centroid, role, 
          displacement_type, qualifier, figure, displacement_date, 
          displacement_start_date, displacement_end_date, year_displacement,
          event_id, event_name, event_start_date, event_end_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        row['Country Name insrael'],
        row['Country ISO3'],
        parseInt(row.Year) || null,
        row['Indicator Name'],
        row['Indicator Code'],
        row['Value finaly israel'],
        parseInt(row['id Palestine numbers']) || null,
        row.country,
        row.iso3,
        row.latitude,
        row.longitude,
        row.centroid,
        row.role,
        row.displacement_type,
        row.qualifier,
        row.figure,
        row.displacement_date,
        row.displacement_start_date,
        row.displacement_end_date,
        parseInt(row.year) || null,
        parseInt(row.event_id) || null,
        row.event_name,
        row.event_start_date,
        row.event_end_date
      ]);
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`   Imported ${imported}/${rows.length} rows...`);
      }
    } catch (error) {
      console.error(`   Error importing Israel-Palestine row:`, error.message);
    }
  }
  
  console.log(`Israel-Palestine data imported: ${imported} rows`);
}

// Main execution
async function main() {
  console.log('Starting dataset migration to AlloyDB...\n');
  console.log('Database connection:', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
  });
  
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful\n');
    
    // Import each dataset
    await importTesla();
    await importHousing();
    await importIsraelPalestine();
    
    console.log('\nAll datasets imported successfully!');
    console.log('\nVerifying row counts...');
    
    const teslaCount = await pool.query('SELECT COUNT(*) FROM tesla_deliveries');
    const housingCount = await pool.query('SELECT COUNT(*) FROM housing_prices');
    const israelCount = await pool.query('SELECT COUNT(*) FROM israel_palestine_trade');
    
    console.log(`   Tesla deliveries: ${teslaCount.rows[0].count} rows`);
    console.log(`   Housing prices: ${housingCount.rows[0].count} rows`);
    console.log(`   Israel-Palestine trade: ${israelCount.rows[0].count} rows`);
    
    process.exit(0);
  } catch (error) {
    console.error('\nError during migration:', error);
    process.exit(1);
  }
}

main();
