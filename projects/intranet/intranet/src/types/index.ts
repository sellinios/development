// Entity types
export interface Entity {
  id: number | string;
  parent_id?: number | string;
  parent?: Entity;
  children?: Entity[];
  name: string;
  code: string;
  type: 'company' | 'division' | 'department' | 'team';
  description?: string;
  active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  creator?: User;
}

export interface UserEntity {
  id: string;
  user_id: string;
  user?: User;
  entity_id: string;
  entity?: Entity;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  is_primary: boolean;
  assigned_at: string;
  assigned_by?: string;
  assigner?: User;
}

export interface EntitySystemAccess {
  id: string;
  entity_id: string;
  entity?: Entity;
  system_name: 'hr' | 'leave' | 'crm';
  access_level: 'full' | 'read' | 'none';
  custom_permissions?: Record<string, any>;
  enabled: boolean;
}

// User types
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department_id: number;
  department?: Department;
  position_id: number;
  position?: Position;
  date_hired: string;
  leave_balance: number;
  profile_picture?: string;
  phone_number?: string;
  address?: string;
  active: boolean;
  current_entity_id?: string;
  current_entity?: Entity;
  last_entity_switch?: string;
  entities?: UserEntity[];
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
}

export interface Position {
  id: number;
  title: string;
  description?: string;
  level: number;
}

export interface Skill {
  id: number;
  name: string;
  description?: string;
  category: string;
}

export interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  skill?: Skill;
  level: number;
  certified: boolean;
  acquired_at?: string;
}

// Leave management types
export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  default_days: number;
  paid: boolean;
  color: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  user?: User;
  leave_type_id: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  duration: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approver_id?: number;
  approver?: User;
  approved_at?: string;
  comments?: string;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  user?: User;
  leave_type_id: number;
  leave_type?: LeaveType;
  year: number;
  initial_days: number;
  used_days: number;
  accrued_days: number;
  carried_days: number;
  expiry_date?: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string;
  recurring: boolean;
}

// CRM types
export interface Customer {
  id: number;
  company_name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  size?: string;
  annual_revenue?: number;
  source?: string;
  assigned_user_id?: number;
  assigned_user?: User;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  notes?: string;
}

export interface Contact {
  id: number;
  customer_id: number;
  customer?: Customer;
  first_name: string;
  last_name: string;
  job_title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  last_contacted_at?: string;
  notes?: string;
}

export interface Opportunity {
  id: number;
  name: string;
  customer_id: number;
  customer?: Customer;
  primary_contact_id?: number;
  primary_contact?: Contact;
  assigned_user_id: number;
  assigned_user?: User;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  probability: number;
  expected_close_date: string;
  actual_close_date?: string;
  source?: string;
  description?: string;
  next_action?: string;
  next_action_date?: string;
  reason_lost?: string;
}

export interface Activity {
  id: number;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task';
  customer_id?: number;
  customer?: Customer;
  contact_id?: number;
  contact?: Contact;
  opportunity_id?: number;
  opportunity?: Opportunity;
  user_id: number;
  user?: User;
  subject: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration?: number;
  outcome?: string;
  direction?: 'Inbound' | 'Outbound';
  status: 'pending' | 'completed' | 'cancelled';
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  unit_price: number;
  category?: string;
  active: boolean;
}

export interface Quote {
  id: number;
  quote_number: string;
  customer_id: number;
  customer?: Customer;
  opportunity_id?: number;
  opportunity?: Opportunity;
  created_by_id: number;
  created_by?: User;
  issue_date: string;
  expiry_date: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  sub_total: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  accepted_at?: string;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id: number;
  product?: Product;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total_price: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

// Home stats types
export interface HomeStats {
  totalUsers: number;
  totalCustomers: number;
  totalOpportunities: number;
  salesForecast: number;
  pendingLeaveRequests: number;
  upcomingMeetings: number;
  recentActivities: Activity[];
  opportunitiesByStage: {
    stage: string;
    count: number;
    value: number;
  }[];
  monthlySales: {
    month: string;
    value: number;
  }[];
}

export interface Ship {
  id?: number;
  principal_id: number;
  principal_name?: string;
  ship_name: string;
  ship_imo?: number;
  pi_club: string;
  ship_type: 'DRY' | 'WET' | 'PASSENGER' | 'OTHER';
  ship_specific_characterization: string;
  flags: string;
  classification: string;
  dwt_teu: string;
  ship_construction_date?: string;
  cba_coverage?: 'YES' | 'NO';
  type_of_cba?: string;
  forthcoming_dry_dock_date?: string;
  vetting_procedure: boolean;
  forthcoming_vetting?: string;
  engines: string;
  conventional_or_electronic: string;
  engine_tier_category: '1' | '2' | '3';
  dual_fuel: boolean;
  fuel_type: 'DIESEL' | 'METHANOL' | 'LPG' | 'LNG' | 'HYDROGEN' | 'OTHER';
  cranes_aboard: boolean;
  ballast_water_mgmt_system: string;
  ecdis: string;
  scrubber: boolean;
  scrubber_type?: 'Hybrid' | 'Open' | 'Closed';
  created_at?: string;
  updated_at?: string;
}