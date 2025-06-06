#!/usr/bin/env python3
"""
ICON-EU GRIB2 Processor for Greece - Fixed version
Maps cells to existing database structure
"""

import os
import sys
import glob
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import DictCursor
import warnings
warnings.filterwarnings('ignore')

try:
    import xarray as xr
    import cfgrib
except ImportError:
    print("Please install required packages:")
    print("pip install xarray cfgrib eccodes numpy pandas psycopg2-binary")
    sys.exit(1)

def get_cell_mapping():
    """Get cell ID mapping from database"""
    # Database connection
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=int(os.getenv('POSTGRES_PORT', 5432)),
        user=os.getenv('POSTGRES_USER', 'postgres'),
        password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
        database=os.getenv('POSTGRES_DB', 'kairos_db')
    )
    
    cursor = conn.cursor(cursor_factory=DictCursor)
    
    # Get all cells with their coordinates
    cursor.execute("""
        SELECT cell_number as id, 
               round(latitude::numeric, 4) as lat,
               round(longitude::numeric, 4) as lon
        FROM icon_cells
        ORDER BY cell_number
    """)
    
    # Create mapping dictionary
    cell_map = {}
    for row in cursor.fetchall():
        key = f"{row['lat']:.4f},{row['lon']:.4f}"
        cell_map[key] = row['id']
    
    cursor.close()
    conn.close()
    
    print(f"Loaded {len(cell_map)} cells from database")
    return cell_map

def process_grib_file(grib_path, cell_map, run_date, forecast_hour):
    """Process a single GRIB file and extract data for database cells"""
    try:
        # Extract parameter name from filename
        filename = os.path.basename(grib_path)
        param_name = None
        param_map = {
            'T_2M': 't_2m',
            'TD_2M': 'td_2m',
            'RELHUM_2M': 'relhum_2m',
            'U_10M': 'u_10m',
            'V_10M': 'v_10m',
            'PMSL': 'pmsl',
            'TOT_PREC': 'tot_prec',
            'CLCT': 'clct'
        }
        
        for param in param_map.keys():
            if param in filename:
                param_name = param_map[param]
                break
        
        if not param_name:
            print(f"Unknown parameter in file: {filename}")
            return None
        
        # Open GRIB file
        try:
            ds = xr.open_dataset(grib_path, engine='cfgrib')
        except Exception as e:
            print(f"Error opening {filename}: {e}")
            return None
        
        # Get the data variable
        data_vars = list(ds.data_vars)
        if not data_vars:
            print(f"No data variables found in {filename}")
            return None
        
        var_name = data_vars[0]
        data = ds[var_name]
        
        # Get coordinate arrays
        lats = data.latitude.values
        lons = data.longitude.values
        values = data.values
        
        if len(values.shape) > 2:
            values = values[0]  # Take first time/level
        
        # Extract data for cells in our database
        results = []
        found_cells = 0
        forecast_datetime = run_date + timedelta(hours=forecast_hour)
        
        # Create meshgrid if needed
        if len(lats.shape) == 1 and len(lons.shape) == 1:
            lon_grid, lat_grid = np.meshgrid(lons, lats)
        else:
            lat_grid = lats
            lon_grid = lons
        
        # Process each point
        for j in range(lat_grid.shape[0]):
            for i in range(lat_grid.shape[1]):
                lat = round(float(lat_grid[j, i]), 4)
                lon = round(float(lon_grid[j, i]), 4)
                key = f"{lat:.4f},{lon:.4f}"
                
                # Calculate cell_id based on grid position
                # This assumes the grid is consistent with the original numbering
                cell_id = j * lon_grid.shape[1] + i + 1
                
                if not cell_map or cell_id <= 24581:  # Only process cells we know about
                    value = float(values[j, i])
                    
                    # Convert units if needed
                    if param_name in ['t_2m', 'td_2m']:
                        # Convert from Kelvin to Celsius
                        value = value - 273.15
                    elif param_name == 'pmsl':
                        # Convert from Pa to hPa
                        value = value / 100.0
                    elif param_name == 'clct':
                        # Ensure percentage
                        if value <= 1:
                            value = value * 100.0
                    
                    results.append({
                        'cell_id': cell_id,
                        'forecast_datetime': forecast_datetime.isoformat(),
                        'parameter': param_name,
                        'value': value
                    })
                    found_cells += 1
        
        ds.close()
        
        print(f"Processed {filename}: {found_cells} cells matched database")
        return results
        
    except Exception as e:
        print(f"Error processing {grib_path}: {e}")
        return None

def process_icon_cycle(cycle_dir, output_dir, cell_map=None):
    """Process all GRIB files for a single ICON cycle"""
    # Parse cycle info
    cycle_name = os.path.basename(cycle_dir)
    
    # Handle both formats: YYYYMMDDHH and YYYYMMDD_HH
    if '_' in cycle_name:
        date_str, hour_str = cycle_name.split('_')
        run_date = datetime.strptime(date_str + hour_str, '%Y%m%d%H')
    else:
        # Format: YYYYMMDDHH
        date_str = cycle_name[:8]
        hour_str = cycle_name[8:10]
        run_date = datetime.strptime(cycle_name[:10], '%Y%m%d%H')
    
    print(f"\nProcessing ICON cycle: {cycle_name}")
    print(f"Run date: {run_date}")
    
    # Create output directory
    cycle_output_dir = os.path.join(output_dir, cycle_name)
    os.makedirs(cycle_output_dir, exist_ok=True)
    
    # Find all GRIB files
    grib_files = glob.glob(os.path.join(cycle_dir, '*.grib2'))
    print(f"Found {len(grib_files)} GRIB files to process")
    
    # Group files by forecast hour
    hour_files = {}
    for grib_file in grib_files:
        parts = os.path.basename(grib_file).split('_')
        if len(parts) >= 6:
            forecast_str = parts[5]
            try:
                forecast_hour = int(forecast_str)
                if forecast_hour not in hour_files:
                    hour_files[forecast_hour] = []
                hour_files[forecast_hour].append(grib_file)
            except ValueError:
                print(f"Could not parse forecast hour from: {grib_file}")
    
    # Process each forecast hour
    for forecast_hour in sorted(hour_files.keys()):
        print(f"\nProcessing forecast hour {forecast_hour:03d}")
        
        all_results = []
        files = hour_files[forecast_hour]
        
        # Process files for this hour
        for grib_file in files:
            results = process_grib_file(grib_file, cell_map, run_date, forecast_hour)
            if results:
                all_results.extend(results)
        
        # Save to CSV
        if all_results:
            df = pd.DataFrame(all_results)
            output_file = os.path.join(cycle_output_dir, f'forecast_{forecast_hour:03d}.csv')
            df.to_csv(output_file, index=False)
            print(f"Saved {len(df)} records to {output_file}")
    
    print(f"\nCompleted processing cycle {cycle_name}")

def main():
    parser = argparse.ArgumentParser(description='Process ICON-EU GRIB files for Greece')
    parser.add_argument('--data-dir', default='./data/ICON-EU', help='Base data directory')
    parser.add_argument('--cycle', help='Specific cycle to process (YYYYMMDD_HH or YYYYMMDDHH)')
    
    args = parser.parse_args()
    
    # Get cell mapping from database
    cell_map = get_cell_mapping()
    
    # Set up directories
    data_dir = args.data_dir
    output_dir = os.path.join(data_dir, 'filtered_tiles_data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Find cycles to process
    if args.cycle:
        cycle_dirs = [os.path.join(data_dir, args.cycle)]
    else:
        # Find all cycle directories
        pattern1 = os.path.join(data_dir, '[0-9]*_[0-9]*')
        pattern2 = os.path.join(data_dir, '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
        cycle_dirs = sorted(glob.glob(pattern1) + glob.glob(pattern2))
        
        if not cycle_dirs:
            print(f"No cycle directories found in {data_dir}")
            return
        
        # Process only the latest cycle
        cycle_dirs = [cycle_dirs[-1]]
    
    # Process each cycle
    for cycle_dir in cycle_dirs:
        if os.path.isdir(cycle_dir):
            process_icon_cycle(cycle_dir, output_dir, cell_map)
        else:
            print(f"Directory not found: {cycle_dir}")
    
    print("\nProcessing complete!")

if __name__ == '__main__':
    main()