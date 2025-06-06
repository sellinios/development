#!/usr/bin/env python3
"""
Associate cities from geo_entities with their nearest ICON grid cells.
This creates a mapping between cities and weather data cells for faster queries.
"""

import psycopg2
import os
from datetime import datetime

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=int(os.getenv('POSTGRES_PORT', 5432)),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
        database=os.getenv('POSTGRES_DB', 'kairos_db')
    )

def create_association_table(conn):
    """Create table to store city-cell associations"""
    cur = conn.cursor()
    
    # Create association table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS city_cell_associations (
            id SERIAL PRIMARY KEY,
            city_id INTEGER NOT NULL REFERENCES geo_entities(id),
            cell_id INTEGER NOT NULL REFERENCES icon_cells(id),
            distance_km FLOAT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(city_id)
        );
    """)
    
    # Create indexes
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_city_cell_city_id ON city_cell_associations(city_id);
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_city_cell_cell_id ON city_cell_associations(cell_id);
    """)
    
    conn.commit()
    print("✓ Created city_cell_associations table")

def associate_cities_with_cells(conn):
    """Find nearest cell for each city and store association"""
    cur = conn.cursor()
    
    # Get all cities
    cur.execute("""
        SELECT id, name, name_en, 
               ST_Y(centroid::geometry) as lat, 
               ST_X(centroid::geometry) as lon,
               population
        FROM geo_entities
        ORDER BY population DESC NULLS LAST
    """)
    
    cities = cur.fetchall()
    print(f"Found {len(cities)} cities/towns/villages to process")
    
    associations = []
    for city_id, name, name_en, lat, lon, population in cities:
        # Find nearest cell
        cur.execute("""
            SELECT id, ST_Distance(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
            ) / 1000 as distance_km
            FROM icon_cells
            WHERE ST_DWithin(
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                50000  -- 50km radius
            )
            ORDER BY distance_km
            LIMIT 1
        """, (lon, lat, lon, lat))
        
        result = cur.fetchone()
        if result:
            cell_id, distance = result
            associations.append((city_id, cell_id, distance))
            
            # Print progress for major cities
            if population and population > 10000:
                display_name = name_en or name
                print(f"  {display_name} (pop: {population:,}) → Cell {cell_id} ({distance:.1f} km)")
    
    # Insert associations
    if associations:
        cur.execute("DELETE FROM city_cell_associations")  # Clear existing
        
        cur.executemany("""
            INSERT INTO city_cell_associations (city_id, cell_id, distance_km)
            VALUES (%s, %s, %s)
            ON CONFLICT (city_id) DO UPDATE 
            SET cell_id = EXCLUDED.cell_id,
                distance_km = EXCLUDED.distance_km,
                updated_at = NOW()
        """, associations)
        
        conn.commit()
        print(f"\n✓ Associated {len(associations)} cities with grid cells")
    
    # Show statistics
    cur.execute("""
        SELECT 
            COUNT(*) as total_associations,
            AVG(distance_km) as avg_distance,
            MIN(distance_km) as min_distance,
            MAX(distance_km) as max_distance
        FROM city_cell_associations
    """)
    
    stats = cur.fetchone()
    print(f"\nStatistics:")
    print(f"  Total associations: {stats[0]}")
    print(f"  Average distance: {stats[1]:.2f} km")
    print(f"  Min distance: {stats[2]:.2f} km")
    print(f"  Max distance: {stats[3]:.2f} km")

def verify_major_cities(conn):
    """Verify associations for major Greek cities"""
    cur = conn.cursor()
    
    print("\nMajor city associations:")
    major_cities = ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 
                    'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis']
    
    for city_name in major_cities:
        cur.execute("""
            SELECT 
                ge.name_en,
                ge.population,
                cca.cell_id,
                cca.distance_km,
                ST_Y(ge.centroid::geometry) as city_lat,
                ST_X(ge.centroid::geometry) as city_lon,
                ST_Y(ST_Centroid(ic.boundary::geometry)) as cell_lat,
                ST_X(ST_Centroid(ic.boundary::geometry)) as cell_lon
            FROM geo_entities ge
            JOIN city_cell_associations cca ON ge.id = cca.city_id
            JOIN icon_cells ic ON cca.cell_id = ic.id
            WHERE LOWER(ge.name_en) = LOWER(%s) OR LOWER(ge.name) = LOWER(%s)
            LIMIT 1
        """, (city_name, city_name))
        
        result = cur.fetchone()
        if result:
            name, pop, cell_id, dist, city_lat, city_lon, cell_lat, cell_lon = result
            print(f"  {name}: Cell {cell_id} ({dist:.1f} km away)")
            print(f"    City: {city_lat:.4f}°N, {city_lon:.4f}°E")
            print(f"    Cell: {cell_lat:.4f}°N, {cell_lon:.4f}°E")

def main():
    """Main function"""
    print("City-Cell Association Tool")
    print("=" * 50)
    
    try:
        conn = get_db_connection()
        print("✓ Connected to database")
        
        # Create association table
        create_association_table(conn)
        
        # Associate cities with cells
        associate_cities_with_cells(conn)
        
        # Verify major cities
        verify_major_cities(conn)
        
        print("\n✓ Association complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()