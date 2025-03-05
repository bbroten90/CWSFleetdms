export interface UserProfile {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface UserProfileUpdate {
    first_name?: string;
    last_name?: string;
    email?: string;
  }
  
  export interface UserPreferences {
    theme: string;
    dashboard_layout: string;
    notifications_enabled: boolean;
    email_notifications_enabled: boolean;
  }
  
  export interface UserPreferencesUpdate {
    theme?: string;
    dashboard_layout?: string;
    notifications_enabled?: boolean;
    email_notifications_enabled?: boolean;
  }
  
  export interface PasswordUpdate {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }
  
  export interface ActivityLog {
    log_id: number;
    user_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    details?: string;
    ip_address?: string;
    created_at: string;
  }