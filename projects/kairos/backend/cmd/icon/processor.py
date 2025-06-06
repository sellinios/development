#!/usr/bin/env python3
"""
ICON-EU GRIB2 Processor for Greece
Extracts weather data from GRIB files and converts to CSV format
"""

import os
import sys
import glob
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
import warnings
warnings.filterwarnings('ignore')

try:
    import xarray as xr
    import cfgrib
except ImportError:
    print("Please install required packages:")
    print("pip install xarray cfgrib eccodes numpy pandas")
    sys.exit(1)

# Greece bounding box (for ICON-EU 0.0625° grid)
GREECE_BOUNDS = {
    'min_lat': 34.0,
    'max_lat': 42.0, 
    'min_lon': 19.0,
    'max_lon': 29.9375
}

# ICON-EU grid resolution (approximately)
GRID_RESOLUTION = 0.0625  # degrees

# Weather parameters to extract
PARAMETERS = {
    'T_2M': 't2m',           # Temperature at 2m
    'TD_2M': 'td2m',         # Dew point at 2m  
    'RELHUM_2M': 'r2',       # Relative humidity at 2m
    'U_10M': 'u10',          # U-component of wind at 10m
    'V_10M': 'v10',          # V-component of wind at 10m
    'PMSL': 'prmsl',         # Pressure at mean sea level
    'TOT_PREC': 'tp',        # Total precipitation
    'CLCT': 'tcc',           # Total cloud cover
}

def create_grid_cells():
    """Create grid cells for Greece region"""
    lats = np.arange(GREECE_BOUNDS['min_lat'], GREECE_BOUNDS['max_lat'] + GRID_RESOLUTION, GRID_RESOLUTION)
    lons = np.arange(GREECE_BOUNDS['min_lon'], GREECE_BOUNDS['max_lon'] + GRID_RESOLUTION, GRID_RESOLUTION)
    
    cells = []
    cell_id = 1
    
    for lat in lats:
        for lon in lons:
            cells.append({
                'cell_id': cell_id,
                'lat': round(lat, 4),
                'lon': round(lon, 4)
            })
            cell_id += 1
    
    return pd.DataFrame(cells)

def process_grib_file(grib_path, cells_df, run_date, forecast_hour):
    """Process a single GRIB file and extract data for Greece"""
    try:
        # Extract parameter name from filename
        filename = os.path.basename(grib_path)
        param_name = None
        for param in PARAMETERS.keys():
            if param in filename:
                param_name = param
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
        
        # Get the data variable (first available)
        data_vars = list(ds.data_vars)
        if not data_vars:
            print(f"No data variables found in {filename}")
            return None
        
        var_name = data_vars[0]
        data = ds[var_name]
        
        # Extract data for Greece region
        results = []
        
        # Get coordinate arrays
        lats = data.latitude.values
        lons = data.longitude.values
        
        # Create meshgrid if needed
        if len(lats.shape) == 1 and len(lons.shape) == 1:
            lon_grid, lat_grid = np.meshgrid(lons, lats)
        else:
            lat_grid = lats
            lon_grid = lons
        
        # Find indices for Greece region
        mask = (
            (lat_grid >= GREECE_BOUNDS['min_lat']) & 
            (lat_grid <= GREECE_BOUNDS['max_lat']) &
            (lon_grid >= GREECE_BOUNDS['min_lon']) & 
            (lon_grid <= GREECE_BOUNDS['max_lon'])
        )
        
        # Extract values
        values = data.values
        if len(values.shape) > 2:
            values = values[0]  # Take first time/level if multiple
        
        # Get masked values
        greece_lats = lat_grid[mask]
        greece_lons = lon_grid[mask]
        greece_values = values[mask]
        
        # Convert units if needed
        if param_name in ['T_2M', 'TD_2M']:
            # Convert from Kelvin to Celsius
            greece_values = greece_values - 273.15
        elif param_name == 'PMSL':
            # Convert from Pa to hPa
            greece_values = greece_values / 100.0
        elif param_name == 'CLCT':
            # Ensure percentage
            if greece_values.max() <= 1:
                greece_values = greece_values * 100.0
        
        # Calculate forecast datetime
        forecast_datetime = run_date + timedelta(hours=forecast_hour)
        
        # Map to grid cells
        for i in range(len(greece_lats)):
            lat = round(greece_lats[i], 4)
            lon = round(greece_lons[i], 4)
            value = float(greece_values[i])
            
            # Find closest cell
            cell = cells_df.loc[
                (cells_df['lat'] == lat) & 
                (cells_df['lon'] == lon)
            ]
            
            if len(cell) > 0:
                cell_id = int(cell.iloc[0]['cell_id'])
            else:
                # Find nearest cell
                distances = ((cells_df['lat'] - lat)**2 + (cells_df['lon'] - lon)**2)
                cell_id = int(cells_df.loc[distances.idxmin()]['cell_id'])
            
            results.append({
                'cell_id': cell_id,
                'forecast_datetime': forecast_datetime.isoformat(),
                'parameter': param_name.lower(),
                'value': value
            })
        
        ds.close()
        
        print(f"Processed {filename}: {len(results)} data points")
        return results
        
    except Exception as e:
        print(f"Error processing {grib_path}: {e}")
        return None

def process_icon_cycle(cycle_dir, output_dir):
    """Process all GRIB files for a single ICON cycle"""
    # Parse cycle info from directory name
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
    
    # Get grid cells
    cells_df = create_grid_cells()
    print(f"Created {len(cells_df)} grid cells for Greece")
    
    # Find all GRIB files
    grib_files = glob.glob(os.path.join(cycle_dir, '*.grib2'))
    print(f"Found {len(grib_files)} GRIB files to process")
    
    if not grib_files:
        print("No GRIB files found!")
        return
    
    # Group files by forecast hour
    hour_files = {}
    for grib_file in grib_files:
        # Extract forecast hour from filename
        # Format: icon-eu_europe_regular-lat-lon_single-level_YYYYMMDDHH_FFF_PARAM.grib2
        parts = os.path.basename(grib_file).split('_')
        if len(parts) >= 6:
            forecast_str = parts[5]  # FFF format
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
        with ProcessPoolExecutor(max_workers=4) as executor:
            futures = []
            for grib_file in files:
                future = executor.submit(process_grib_file, grib_file, cells_df, run_date, forecast_hour)
                futures.append(future)
            
            for future in as_completed(futures):
                results = future.result()
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
    parser.add_argument('--cycle', help='Specific cycle to process (YYYYMMDD_HH)')
    parser.add_argument('--max-workers', type=int, default=4, help='Maximum parallel workers')
    
    args = parser.parse_args()
    
    # Set up directories
    data_dir = args.data_dir
    output_dir = os.path.join(data_dir, 'filtered_tiles_data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Find cycles to process
    if args.cycle:
        cycle_dirs = [os.path.join(data_dir, args.cycle)]
    else:
        # Find all cycle directories (both formats: YYYYMMDD_HH and YYYYMMDDHH)
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
            process_icon_cycle(cycle_dir, output_dir)
        else:
            print(f"Directory not found: {cycle_dir}")
    
    print("\nProcessing complete!")

if __name__ == '__main__':
    main()