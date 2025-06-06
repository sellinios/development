"""
Physics Knowledge Bootstrap
Loads fundamental physics constants and formulas
"""

from typing import Dict, Any, List


class PhysicsBootstrap:
    """Loads physics knowledge into Zeus"""
    
    def __init__(self, ermis_interface):
        self.ermis = ermis_interface
        
    def load(self) -> Dict[str, Any]:
        """Load all physics knowledge"""
        counts = {
            'constants': 0,
            'formulas': 0,
            'units': 0
        }
        
        # Load physical constants
        constants = self._get_physical_constants()
        for name, value, unit, description in constants:
            success = self.ermis.store(name, value, {
                'type': 'constant',
                'category': 'physics',
                'unit': unit,
                'description': description,
                'immutable': True
            })
            if success:
                counts['constants'] += 1
                
        # Load physics formulas
        formulas = self._get_physics_formulas()
        for formula_data in formulas:
            success = self.ermis.store(formula_data['name'], formula_data, {
                'type': 'formula',
                'category': 'physics',
                'domain': formula_data.get('domain', 'general')
            })
            if success:
                counts['formulas'] += 1
                
        # Load unit conversions
        units = self._get_unit_conversions()
        for unit_data in units:
            success = self.ermis.store(unit_data['name'], unit_data, {
                'type': 'unit_conversion',
                'category': 'physics'
            })
            if success:
                counts['units'] += 1
                
        return {
            'status': 'success',
            'counts': counts
        }
        
    def _get_physical_constants(self) -> List[tuple]:
        """Get fundamental physical constants"""
        return [
            # Universal constants
            ('c', 299792458, 'm/s', 'Speed of light in vacuum'),
            ('h', 6.62607015e-34, 'J⋅s', 'Planck constant'),
            ('hbar', 1.054571817e-34, 'J⋅s', 'Reduced Planck constant'),
            ('G', 6.67430e-11, 'm³⋅kg⁻¹⋅s⁻²', 'Gravitational constant'),
            ('k_B', 1.380649e-23, 'J/K', 'Boltzmann constant'),
            ('N_A', 6.02214076e23, 'mol⁻¹', 'Avogadro constant'),
            ('R', 8.314462618, 'J⋅mol⁻¹⋅K⁻¹', 'Gas constant'),
            
            # Electromagnetic constants
            ('elementary_charge', 1.602176634e-19, 'C', 'Elementary charge'),
            ('e_charge', 1.602176634e-19, 'C', 'Elementary charge (alias)'),
            ('m_e', 9.1093837015e-31, 'kg', 'Electron mass'),
            ('m_p', 1.67262192369e-27, 'kg', 'Proton mass'),
            ('m_n', 1.67492749804e-27, 'kg', 'Neutron mass'),
            ('mu_0', 1.25663706212e-6, 'N⋅A⁻²', 'Vacuum permeability'),
            ('epsilon_0', 8.8541878128e-12, 'F⋅m⁻¹', 'Vacuum permittivity'),
            ('alpha', 0.0072973525693, '1', 'Fine-structure constant'),
            
            # Atomic constants
            ('a_0', 5.29177210903e-11, 'm', 'Bohr radius'),
            ('R_inf', 10973731.568160, 'm⁻¹', 'Rydberg constant'),
            ('mu_B', 9.2740100783e-24, 'J⋅T⁻¹', 'Bohr magneton'),
            ('mu_N', 5.0507837461e-27, 'J⋅T⁻¹', 'Nuclear magneton'),
            
            # Other important constants
            ('sigma', 5.670374419e-8, 'W⋅m⁻²⋅K⁻⁴', 'Stefan-Boltzmann constant'),
            ('g', 9.80665, 'm⋅s⁻²', 'Standard gravity'),
            ('atm', 101325, 'Pa', 'Standard atmosphere'),
            ('T_0', 273.15, 'K', 'Zero Celsius in Kelvin'),
            
            # Astronomical constants
            ('AU', 1.495978707e11, 'm', 'Astronomical unit'),
            ('ly', 9.4607304725808e15, 'm', 'Light year'),
            ('parsec', 3.0857e16, 'm', 'Parsec'),
            ('M_sun', 1.98892e30, 'kg', 'Solar mass'),
            ('R_sun', 6.96e8, 'm', 'Solar radius'),
            ('M_earth', 5.972e24, 'kg', 'Earth mass'),
            ('R_earth', 6.371e6, 'm', 'Earth radius'),
            
            # Quantum constants
            ('eV', 1.602176634e-19, 'J', 'Electron volt'),
            ('alpha_s', 0.1181, '1', 'Strong coupling constant'),
            ('lambda_C', 2.42631023867e-12, 'm', 'Compton wavelength'),
            ('r_e', 2.8179403262e-15, 'm', 'Classical electron radius')
        ]
        
    def _get_physics_formulas(self) -> List[Dict[str, Any]]:
        """Get physics formula definitions"""
        return [
            # Mechanics
            {
                'name': 'kinetic_energy',
                'parameters': ['mass', 'velocity'],
                'formula': '0.5 * mass * velocity**2',
                'description': 'Kinetic energy',
                'unit': 'J',
                'domain': 'mechanics'
            },
            {
                'name': 'potential_energy',
                'parameters': ['mass', 'height'],
                'formula': 'mass * 9.80665 * height',
                'description': 'Gravitational potential energy',
                'unit': 'J',
                'domain': 'mechanics'
            },
            {
                'name': 'momentum',
                'parameters': ['mass', 'velocity'],
                'formula': 'mass * velocity',
                'description': 'Linear momentum',
                'unit': 'kg⋅m/s',
                'domain': 'mechanics'
            },
            {
                'name': 'force',
                'parameters': ['mass', 'acceleration'],
                'formula': 'mass * acceleration',
                'description': 'Newton\'s second law',
                'unit': 'N',
                'domain': 'mechanics'
            },
            {
                'name': 'centripetal_force',
                'parameters': ['mass', 'velocity', 'radius'],
                'formula': 'mass * velocity**2 / radius',
                'description': 'Centripetal force',
                'unit': 'N',
                'domain': 'mechanics'
            },
            
            # Waves and Oscillations
            {
                'name': 'wave_speed',
                'parameters': ['frequency', 'wavelength'],
                'formula': 'frequency * wavelength',
                'description': 'Wave speed equation',
                'unit': 'm/s',
                'domain': 'waves'
            },
            {
                'name': 'period',
                'parameters': ['frequency'],
                'formula': '1 / frequency',
                'description': 'Period of oscillation',
                'unit': 's',
                'domain': 'waves'
            },
            {
                'name': 'simple_harmonic_period',
                'parameters': ['length'],
                'formula': '2 * 3.14159265359 * (length / 9.80665)**0.5',
                'description': 'Period of simple pendulum',
                'unit': 's',
                'domain': 'waves'
            },
            
            # Thermodynamics
            {
                'name': 'ideal_gas_law',
                'parameters': ['pressure', 'volume', 'moles', 'temperature'],
                'formula': 'pressure * volume - moles * 8.314462618 * temperature',
                'description': 'Ideal gas law (PV = nRT)',
                'unit': 'J',
                'domain': 'thermodynamics'
            },
            {
                'name': 'thermal_expansion',
                'parameters': ['length', 'alpha', 'delta_T'],
                'formula': 'length * alpha * delta_T',
                'description': 'Linear thermal expansion',
                'unit': 'm',
                'domain': 'thermodynamics'
            },
            {
                'name': 'heat_capacity',
                'parameters': ['mass', 'specific_heat', 'delta_T'],
                'formula': 'mass * specific_heat * delta_T',
                'description': 'Heat energy',
                'unit': 'J',
                'domain': 'thermodynamics'
            },
            
            # Electromagnetism
            {
                'name': 'coulomb_force',
                'parameters': ['q1', 'q2', 'distance'],
                'formula': '8.9875517923e9 * q1 * q2 / distance**2',
                'description': 'Coulomb\'s law',
                'unit': 'N',
                'domain': 'electromagnetism'
            },
            {
                'name': 'electric_field',
                'parameters': ['charge', 'distance'],
                'formula': '8.9875517923e9 * charge / distance**2',
                'description': 'Electric field of point charge',
                'unit': 'N/C',
                'domain': 'electromagnetism'
            },
            {
                'name': 'magnetic_force',
                'parameters': ['charge', 'velocity', 'B_field'],
                'formula': 'charge * velocity * B_field',
                'description': 'Lorentz force (perpendicular)',
                'unit': 'N',
                'domain': 'electromagnetism'
            },
            {
                'name': 'ohms_law',
                'parameters': ['voltage', 'current'],
                'formula': 'voltage / current',
                'description': 'Ohm\'s law (R = V/I)',
                'unit': 'Ω',
                'domain': 'electromagnetism'
            },
            {
                'name': 'power',
                'parameters': ['voltage', 'current'],
                'formula': 'voltage * current',
                'description': 'Electrical power',
                'unit': 'W',
                'domain': 'electromagnetism'
            },
            
            # Modern Physics
            {
                'name': 'relativistic_energy',
                'parameters': ['mass'],
                'formula': 'mass * 299792458**2',
                'description': 'Einstein\'s mass-energy equivalence',
                'unit': 'J',
                'domain': 'relativity'
            },
            {
                'name': 'time_dilation',
                'parameters': ['proper_time', 'velocity'],
                'formula': 'proper_time / (1 - (velocity/299792458)**2)**0.5',
                'description': 'Time dilation',
                'unit': 's',
                'domain': 'relativity'
            },
            {
                'name': 'length_contraction',
                'parameters': ['proper_length', 'velocity'],
                'formula': 'proper_length * (1 - (velocity/299792458)**2)**0.5',
                'description': 'Length contraction',
                'unit': 'm',
                'domain': 'relativity'
            },
            {
                'name': 'photon_energy',
                'parameters': ['frequency'],
                'formula': '6.62607015e-34 * frequency',
                'description': 'Photon energy',
                'unit': 'J',
                'domain': 'quantum'
            },
            {
                'name': 'de_broglie_wavelength',
                'parameters': ['momentum'],
                'formula': '6.62607015e-34 / momentum',
                'description': 'de Broglie wavelength',
                'unit': 'm',
                'domain': 'quantum'
            },
            {
                'name': 'uncertainty_principle',
                'parameters': ['delta_x', 'delta_p'],
                'formula': 'delta_x * delta_p - 5.27285909e-35',
                'description': 'Heisenberg uncertainty (Δx⋅Δp ≥ ℏ/2)',
                'unit': 'J⋅s',
                'domain': 'quantum'
            }
        ]
        
    def _get_unit_conversions(self) -> List[Dict[str, Any]]:
        """Get unit conversion definitions"""
        return [
            # Length conversions
            {
                'name': 'meters_to_feet',
                'from_unit': 'm',
                'to_unit': 'ft',
                'factor': 3.28084,
                'formula': 'value * 3.28084'
            },
            {
                'name': 'kilometers_to_miles',
                'from_unit': 'km',
                'to_unit': 'mi',
                'factor': 0.621371,
                'formula': 'value * 0.621371'
            },
            {
                'name': 'inches_to_cm',
                'from_unit': 'in',
                'to_unit': 'cm',
                'factor': 2.54,
                'formula': 'value * 2.54'
            },
            
            # Mass conversions
            {
                'name': 'kg_to_pounds',
                'from_unit': 'kg',
                'to_unit': 'lb',
                'factor': 2.20462,
                'formula': 'value * 2.20462'
            },
            {
                'name': 'grams_to_ounces',
                'from_unit': 'g',
                'to_unit': 'oz',
                'factor': 0.035274,
                'formula': 'value * 0.035274'
            },
            
            # Temperature conversions
            {
                'name': 'celsius_to_fahrenheit',
                'from_unit': '°C',
                'to_unit': '°F',
                'formula': 'value * 9/5 + 32'
            },
            {
                'name': 'kelvin_to_celsius',
                'from_unit': 'K',
                'to_unit': '°C',
                'formula': 'value - 273.15'
            },
            {
                'name': 'fahrenheit_to_kelvin',
                'from_unit': '°F',
                'to_unit': 'K',
                'formula': '(value - 32) * 5/9 + 273.15'
            },
            
            # Energy conversions
            {
                'name': 'joules_to_calories',
                'from_unit': 'J',
                'to_unit': 'cal',
                'factor': 0.239006,
                'formula': 'value * 0.239006'
            },
            {
                'name': 'eV_to_joules',
                'from_unit': 'eV',
                'to_unit': 'J',
                'factor': 1.602176634e-19,
                'formula': 'value * 1.602176634e-19'
            },
            {
                'name': 'kWh_to_joules',
                'from_unit': 'kWh',
                'to_unit': 'J',
                'factor': 3600000,
                'formula': 'value * 3600000'
            },
            
            # Pressure conversions
            {
                'name': 'pascal_to_bar',
                'from_unit': 'Pa',
                'to_unit': 'bar',
                'factor': 1e-5,
                'formula': 'value * 1e-5'
            },
            {
                'name': 'atm_to_pascal',
                'from_unit': 'atm',
                'to_unit': 'Pa',
                'factor': 101325,
                'formula': 'value * 101325'
            },
            {
                'name': 'psi_to_pascal',
                'from_unit': 'psi',
                'to_unit': 'Pa',
                'factor': 6894.76,
                'formula': 'value * 6894.76'
            },
            
            # Speed conversions
            {
                'name': 'ms_to_kmh',
                'from_unit': 'm/s',
                'to_unit': 'km/h',
                'factor': 3.6,
                'formula': 'value * 3.6'
            },
            {
                'name': 'mph_to_ms',
                'from_unit': 'mph',
                'to_unit': 'm/s',
                'factor': 0.44704,
                'formula': 'value * 0.44704'
            },
            {
                'name': 'knots_to_ms',
                'from_unit': 'kn',
                'to_unit': 'm/s',
                'factor': 0.514444,
                'formula': 'value * 0.514444'
            }
        ]