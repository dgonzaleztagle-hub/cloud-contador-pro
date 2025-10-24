export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          activo: boolean
          ciudad: string | null
          clave_certificado: string | null
          clave_sii: string | null
          clave_sii_repr: string | null
          clave_unica: string | null
          cod_actividad: string | null
          contabilidad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          fecha_incorporacion: string | null
          fono: string | null
          giro: string | null
          id: string
          observacion_1: string | null
          observacion_2: string | null
          observacion_3: string | null
          portal_electronico: string | null
          previred: string | null
          razon_social: string
          regimen_tributario: string | null
          region: string | null
          representante_legal: string | null
          rut: string
          rut_representante: string | null
          updated_at: string
          user_id: string | null
          valor: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          clave_certificado?: string | null
          clave_sii?: string | null
          clave_sii_repr?: string | null
          clave_unica?: string | null
          cod_actividad?: string | null
          contabilidad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_incorporacion?: string | null
          fono?: string | null
          giro?: string | null
          id?: string
          observacion_1?: string | null
          observacion_2?: string | null
          observacion_3?: string | null
          portal_electronico?: string | null
          previred?: string | null
          razon_social: string
          regimen_tributario?: string | null
          region?: string | null
          representante_legal?: string | null
          rut: string
          rut_representante?: string | null
          updated_at?: string
          user_id?: string | null
          valor?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          clave_certificado?: string | null
          clave_sii?: string | null
          clave_sii_repr?: string | null
          clave_unica?: string | null
          cod_actividad?: string | null
          contabilidad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_incorporacion?: string | null
          fono?: string | null
          giro?: string | null
          id?: string
          observacion_1?: string | null
          observacion_2?: string | null
          observacion_3?: string | null
          portal_electronico?: string | null
          previred?: string | null
          razon_social?: string
          regimen_tributario?: string | null
          region?: string | null
          representante_legal?: string | null
          rut?: string
          rut_representante?: string | null
          updated_at?: string
          user_id?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      f29_declarations: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          estado_honorarios: string
          honorarios: number
          id: string
          impuesto_unico: number
          iva_compras: number
          iva_neto: number
          iva_ventas: number
          observaciones: string | null
          periodo_anio: number
          periodo_mes: number
          ppm: number
          remanente_anterior: number
          remanente_proximo: number
          retencion_2cat: number
          total_general: number
          total_impuestos: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          estado_honorarios?: string
          honorarios?: number
          id?: string
          impuesto_unico?: number
          iva_compras?: number
          iva_neto?: number
          iva_ventas?: number
          observaciones?: string | null
          periodo_anio: number
          periodo_mes: number
          ppm?: number
          remanente_anterior?: number
          remanente_proximo?: number
          retencion_2cat?: number
          total_general?: number
          total_impuestos?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          estado_honorarios?: string
          honorarios?: number
          id?: string
          impuesto_unico?: number
          iva_compras?: number
          iva_neto?: number
          iva_ventas?: number
          observaciones?: string | null
          periodo_anio?: number
          periodo_mes?: number
          ppm?: number
          remanente_anterior?: number
          remanente_proximo?: number
          retencion_2cat?: number
          total_general?: number
          total_impuestos?: number
        }
        Relationships: [
          {
            foreignKeyName: "f29_declarations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          client_id: string
          created_at: string
          file_category: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          periodo_anio: number | null
          periodo_mes: number | null
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          file_category: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          file_category?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          periodo_anio?: number | null
          periodo_mes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rrhh_workers: {
        Row: {
          anticipo: number | null
          atrasos: number | null
          client_id: string
          created_at: string
          faltas: number | null
          id: string
          nombre: string
          periodo_anio: number
          periodo_mes: number
          permisos: number | null
          plazo_contrato: string | null
          rut: string
          updated_at: string
        }
        Insert: {
          anticipo?: number | null
          atrasos?: number | null
          client_id: string
          created_at?: string
          faltas?: number | null
          id?: string
          nombre: string
          periodo_anio: number
          periodo_mes: number
          permisos?: number | null
          plazo_contrato?: string | null
          rut: string
          updated_at?: string
        }
        Update: {
          anticipo?: number | null
          atrasos?: number | null
          client_id?: string
          created_at?: string
          faltas?: number | null
          id?: string
          nombre?: string
          periodo_anio?: number
          periodo_mes?: number
          permisos?: number | null
          plazo_contrato?: string | null
          rut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rrhh_workers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "admin" | "client" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master", "admin", "client", "viewer"],
    },
  },
} as const
