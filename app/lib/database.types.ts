export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          salon_name: string | null;
          username: string | null;
          plan: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          salon_name?: string | null;
          username?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          salon_name?: string | null;
          username?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          duration: number;
          price: number;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          duration: number;
          price: number;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          duration?: number;
          price?: number;
          category?: string | null;
          created_at?: string;
        };
      };
      professionals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          specialty: string | null;
          commission: number | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          specialty?: string | null;
          commission?: number | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          specialty?: string | null;
          commission?: number | null;
          color?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          visits: number;
          last_visit: string | null;
          total_spent: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          visits?: number;
          last_visit?: string | null;
          total_spent?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          visits?: number;
          last_visit?: string | null;
          total_spent?: number;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          service_id: string | null;
          professional_id: string | null;
          date: string;
          time: string;
          duration: number;
          price: number;
          status: string;
          client_name: string | null;
          client_phone: string | null;
          client_email: string | null;
          service_name: string | null;
          professional_name: string | null;
          hair_type: string | null;
          skin_type: string | null;
          allergies: string | null;
          observations: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          service_id?: string | null;
          professional_id?: string | null;
          date: string;
          time: string;
          duration: number;
          price: number;
          status?: string;
          client_name?: string | null;
          client_phone?: string | null;
          client_email?: string | null;
          service_name?: string | null;
          professional_name?: string | null;
          hair_type?: string | null;
          skin_type?: string | null;
          allergies?: string | null;
          observations?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          service_id?: string | null;
          professional_id?: string | null;
          date?: string;
          time?: string;
          duration?: number;
          price?: number;
          status?: string;
          client_name?: string | null;
          client_phone?: string | null;
          client_email?: string | null;
          service_name?: string | null;
          professional_name?: string | null;
          hair_type?: string | null;
          skin_type?: string | null;
          allergies?: string | null;
          observations?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
