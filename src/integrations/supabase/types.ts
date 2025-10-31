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
      ciudades: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          region_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          region_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ciudades_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regiones"
            referencedColumns: ["id"]
          },
        ]
      }
      client_custom_field_values: {
        Row: {
          client_id: string
          created_at: string
          field_id: string
          field_value: string | null
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          field_id: string
          field_value?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          field_id?: string
          field_value?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_field_values_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "client_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      client_custom_fields: {
        Row: {
          created_at: string
          display_order: number
          field_name: string
          field_options: string | null
          field_type: string
          id: string
          is_visible: boolean
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_name: string
          field_options?: string | null
          field_type: string
          id?: string
          is_visible?: boolean
        }
        Update: {
          created_at?: string
          display_order?: number
          field_name?: string
          field_options?: string | null
          field_type?: string
          id?: string
          is_visible?: boolean
        }
        Relationships: []
      }
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
          rcv_compras: number | null
          rcv_ventas: number | null
          regimen_tributario: string | null
          region: string | null
          representante_legal: string | null
          rut: string
          rut_representante: string | null
          saldo_honorarios_pendiente: number
          socio_1_clave_sii: string | null
          socio_1_nombre: string | null
          socio_1_rut: string | null
          socio_2_clave_sii: string | null
          socio_2_nombre: string | null
          socio_2_rut: string | null
          socio_3_clave_sii: string | null
          socio_3_nombre: string | null
          socio_3_rut: string | null
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
          rcv_compras?: number | null
          rcv_ventas?: number | null
          regimen_tributario?: string | null
          region?: string | null
          representante_legal?: string | null
          rut: string
          rut_representante?: string | null
          saldo_honorarios_pendiente?: number
          socio_1_clave_sii?: string | null
          socio_1_nombre?: string | null
          socio_1_rut?: string | null
          socio_2_clave_sii?: string | null
          socio_2_nombre?: string | null
          socio_2_rut?: string | null
          socio_3_clave_sii?: string | null
          socio_3_nombre?: string | null
          socio_3_rut?: string | null
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
          rcv_compras?: number | null
          rcv_ventas?: number | null
          regimen_tributario?: string | null
          region?: string | null
          representante_legal?: string | null
          rut?: string
          rut_representante?: string | null
          saldo_honorarios_pendiente?: number
          socio_1_clave_sii?: string | null
          socio_1_nombre?: string | null
          socio_1_rut?: string | null
          socio_2_clave_sii?: string | null
          socio_2_nombre?: string | null
          socio_2_rut?: string | null
          socio_3_clave_sii?: string | null
          socio_3_nombre?: string | null
          socio_3_rut?: string | null
          updated_at?: string
          user_id?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      correccion_monetaria_sii: {
        Row: {
          anio: number
          created_at: string
          id: string
          mes_debio_declarar: number
          mes_declara: number
          tasa: number
        }
        Insert: {
          anio: number
          created_at?: string
          id?: string
          mes_debio_declarar: number
          mes_declara: number
          tasa: number
        }
        Update: {
          anio?: number
          created_at?: string
          id?: string
          mes_debio_declarar?: number
          mes_declara?: number
          tasa?: number
        }
        Relationships: []
      }
      cotizaciones_previsionales: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_declaracion: string | null
          fecha_pago: string | null
          id: string
          observaciones: string | null
          periodo_anio: number
          periodo_mes: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_declaracion?: string | null
          fecha_pago?: string | null
          id?: string
          observaciones?: string | null
          periodo_anio: number
          periodo_mes: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_declaracion?: string | null
          fecha_pago?: string | null
          id?: string
          observaciones?: string | null
          periodo_anio?: number
          periodo_mes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_previsionales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones_trabajadores: {
        Row: {
          cotizacion_id: string
          created_at: string
          fecha_pago: string | null
          id: string
          monto: number
          pagado: boolean | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          cotizacion_id: string
          created_at?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          pagado?: boolean | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          cotizacion_id?: string
          created_at?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          pagado?: boolean | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_trabajadores_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones_previsionales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_trabajadores_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "rrhh_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      f22_declaraciones: {
        Row: {
          anio_tributario: number
          client_id: string
          created_at: string
          created_by: string | null
          estado: string
          f22_tipo_id: string
          fecha_aceptacion: string | null
          fecha_presentacion: string | null
          id: string
          notificacion_enviada: boolean | null
          observaciones: string | null
          oculta: boolean | null
          resultado: string | null
          updated_at: string
        }
        Insert: {
          anio_tributario: number
          client_id: string
          created_at?: string
          created_by?: string | null
          estado?: string
          f22_tipo_id: string
          fecha_aceptacion?: string | null
          fecha_presentacion?: string | null
          id?: string
          notificacion_enviada?: boolean | null
          observaciones?: string | null
          oculta?: boolean | null
          resultado?: string | null
          updated_at?: string
        }
        Update: {
          anio_tributario?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          f22_tipo_id?: string
          fecha_aceptacion?: string | null
          fecha_presentacion?: string | null
          id?: string
          notificacion_enviada?: boolean | null
          observaciones?: string | null
          oculta?: boolean | null
          resultado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "f22_declaraciones_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "f22_declaraciones_f22_tipo_id_fkey"
            columns: ["f22_tipo_id"]
            isOneToOne: false
            referencedRelation: "f22_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      f22_tipos: {
        Row: {
          activo: boolean | null
          codigo: string
          created_at: string
          descripcion: string | null
          es_comun: boolean | null
          fecha_limite_dia: number
          fecha_limite_mes: number
          id: string
          nombre: string
          orden: number | null
          regimen_tributario: string[] | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_comun?: boolean | null
          fecha_limite_dia: number
          fecha_limite_mes: number
          id?: string
          nombre: string
          orden?: number | null
          regimen_tributario?: string[] | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_comun?: boolean | null
          fecha_limite_dia?: number
          fecha_limite_mes?: number
          id?: string
          nombre?: string
          orden?: number | null
          regimen_tributario?: string[] | null
        }
        Relationships: []
      }
      f29_declarations: {
        Row: {
          client_id: string
          correccion_monetaria: number | null
          created_at: string
          created_by: string | null
          dias_atraso: number | null
          estado_declaracion: string
          estado_honorarios: string
          fecha_limite_declaracion: string | null
          fuera_de_plazo: boolean | null
          honorarios: number
          id: string
          impuesto_unico: number
          interes_moratorio: number | null
          iva_compras: number
          iva_neto: number
          iva_ventas: number
          multa: number | null
          observaciones: string | null
          periodo_anio: number
          periodo_mes: number
          ppm: number
          recargos_con_condonacion: number | null
          remanente_anterior: number
          remanente_proximo: number
          retencion_2cat: number
          tasa_ppm: number | null
          total_general: number
          total_impuestos: number
          total_recargos: number | null
          ultima_sincronizacion_sii: string | null
        }
        Insert: {
          client_id: string
          correccion_monetaria?: number | null
          created_at?: string
          created_by?: string | null
          dias_atraso?: number | null
          estado_declaracion?: string
          estado_honorarios?: string
          fecha_limite_declaracion?: string | null
          fuera_de_plazo?: boolean | null
          honorarios?: number
          id?: string
          impuesto_unico?: number
          interes_moratorio?: number | null
          iva_compras?: number
          iva_neto?: number
          iva_ventas?: number
          multa?: number | null
          observaciones?: string | null
          periodo_anio: number
          periodo_mes: number
          ppm?: number
          recargos_con_condonacion?: number | null
          remanente_anterior?: number
          remanente_proximo?: number
          retencion_2cat?: number
          tasa_ppm?: number | null
          total_general?: number
          total_impuestos?: number
          total_recargos?: number | null
          ultima_sincronizacion_sii?: string | null
        }
        Update: {
          client_id?: string
          correccion_monetaria?: number | null
          created_at?: string
          created_by?: string | null
          dias_atraso?: number | null
          estado_declaracion?: string
          estado_honorarios?: string
          fecha_limite_declaracion?: string | null
          fuera_de_plazo?: boolean | null
          honorarios?: number
          id?: string
          impuesto_unico?: number
          interes_moratorio?: number | null
          iva_compras?: number
          iva_neto?: number
          iva_ventas?: number
          multa?: number | null
          observaciones?: string | null
          periodo_anio?: number
          periodo_mes?: number
          ppm?: number
          recargos_con_condonacion?: number | null
          remanente_anterior?: number
          remanente_proximo?: number
          retencion_2cat?: number
          tasa_ppm?: number | null
          total_general?: number
          total_impuestos?: number
          total_recargos?: number | null
          ultima_sincronizacion_sii?: string | null
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
          descripcion: string | null
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
          descripcion?: string | null
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
          descripcion?: string | null
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
      giros: {
        Row: {
          cod_actividad: string | null
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          cod_actividad?: string | null
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          cod_actividad?: string | null
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      honorarios: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_pago: string | null
          id: string
          monto: number
          monto_pagado: number
          notas: string | null
          periodo_anio: number
          periodo_mes: number
          saldo_actual: number | null
          saldo_pendiente_anterior: number
          total_con_saldo: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          monto_pagado?: number
          notas?: string | null
          periodo_anio: number
          periodo_mes: number
          saldo_actual?: number | null
          saldo_pendiente_anterior?: number
          total_con_saldo?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          monto_pagado?: number
          notas?: string | null
          periodo_anio?: number
          periodo_mes?: number
          saldo_actual?: number | null
          saldo_pendiente_anterior?: number
          total_con_saldo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "honorarios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo: {
        Row: {
          client_id: string
          comentario_cierre: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          estado: string
          folio: number
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          comentario_cierre?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: string
          folio?: number
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          comentario_cierre?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: string
          folio?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_archivos: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          ot_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          ot_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          ot_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_archivos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
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
      regimenes_tributarios: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      regiones: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          orden: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          orden: number
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      rrhh_workers: {
        Row: {
          activo: boolean
          afp: string | null
          apellido_materno: string | null
          apellido_paterno: string | null
          banco: string | null
          cargo: string | null
          ciudad: string | null
          clausulas_especiales: string | null
          client_id: string
          contrato_pdf_path: string | null
          contrato_word_path: string | null
          created_at: string
          datos_admin_completados: boolean | null
          direccion: string | null
          email: string | null
          estado_civil: string | null
          fecha_inicio: string | null
          fecha_nacimiento: string | null
          fecha_termino: string | null
          formulario_completado: boolean | null
          funciones: string | null
          horario_laboral: string | null
          id: string
          nacionalidad: string | null
          nombre: string
          numero_cuenta: string | null
          primer_nombre: string | null
          rut: string
          salud: string | null
          segundo_nombre: string | null
          sucursal_admin: string | null
          sucursal_id: string | null
          sueldo_base: number | null
          telefono: string | null
          tipo_cuenta: string | null
          tipo_jornada: string
          tipo_plazo: string
          turnos_rotativos: boolean | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          afp?: string | null
          apellido_materno?: string | null
          apellido_paterno?: string | null
          banco?: string | null
          cargo?: string | null
          ciudad?: string | null
          clausulas_especiales?: string | null
          client_id: string
          contrato_pdf_path?: string | null
          contrato_word_path?: string | null
          created_at?: string
          datos_admin_completados?: boolean | null
          direccion?: string | null
          email?: string | null
          estado_civil?: string | null
          fecha_inicio?: string | null
          fecha_nacimiento?: string | null
          fecha_termino?: string | null
          formulario_completado?: boolean | null
          funciones?: string | null
          horario_laboral?: string | null
          id?: string
          nacionalidad?: string | null
          nombre: string
          numero_cuenta?: string | null
          primer_nombre?: string | null
          rut: string
          salud?: string | null
          segundo_nombre?: string | null
          sucursal_admin?: string | null
          sucursal_id?: string | null
          sueldo_base?: number | null
          telefono?: string | null
          tipo_cuenta?: string | null
          tipo_jornada?: string
          tipo_plazo?: string
          turnos_rotativos?: boolean | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          afp?: string | null
          apellido_materno?: string | null
          apellido_paterno?: string | null
          banco?: string | null
          cargo?: string | null
          ciudad?: string | null
          clausulas_especiales?: string | null
          client_id?: string
          contrato_pdf_path?: string | null
          contrato_word_path?: string | null
          created_at?: string
          datos_admin_completados?: boolean | null
          direccion?: string | null
          email?: string | null
          estado_civil?: string | null
          fecha_inicio?: string | null
          fecha_nacimiento?: string | null
          fecha_termino?: string | null
          formulario_completado?: boolean | null
          funciones?: string | null
          horario_laboral?: string | null
          id?: string
          nacionalidad?: string | null
          nombre?: string
          numero_cuenta?: string | null
          primer_nombre?: string | null
          rut?: string
          salud?: string | null
          segundo_nombre?: string | null
          sucursal_admin?: string | null
          sucursal_id?: string | null
          sueldo_base?: number | null
          telefono?: string | null
          tipo_cuenta?: string | null
          tipo_jornada?: string
          tipo_plazo?: string
          turnos_rotativos?: boolean | null
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
          {
            foreignKeyName: "rrhh_workers_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      uf_diaria: {
        Row: {
          created_at: string
          fecha: string
          id: string
          valor: number
        }
        Insert: {
          created_at?: string
          fecha: string
          id?: string
          valor: number
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          valor?: number
        }
        Relationships: []
      }
      utm_mensual: {
        Row: {
          anio: number
          created_at: string
          id: string
          mes: number
          valor: number
        }
        Insert: {
          anio: number
          created_at?: string
          id?: string
          mes: number
          valor: number
        }
        Update: {
          anio?: number
          created_at?: string
          id?: string
          mes?: number
          valor?: number
        }
        Relationships: []
      }
      worker_events: {
        Row: {
          cantidad: number
          client_id: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          event_date: string
          event_type: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          periodo_anio: number
          periodo_mes: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          cantidad?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          event_date: string
          event_type: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          periodo_anio: number
          periodo_mes: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          cantidad?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          event_date?: string
          event_type?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          periodo_anio?: number
          periodo_mes?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_events_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "rrhh_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_registration_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_registration_tokens_client_id_fkey"
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
      get_expired_contracts: {
        Args: never
        Returns: {
          client_name: string
          days_expired: number
          fecha_termino: string
          worker_id: string
          worker_name: string
          worker_rut: string
        }[]
      }
      get_expiring_contracts: {
        Args: { days_threshold?: number }
        Returns: {
          client_name: string
          days_remaining: number
          fecha_termino: string
          worker_id: string
          worker_name: string
          worker_rut: string
        }[]
      }
      get_honorarios_summary: {
        Args: { p_anio: number; p_mes: number }
        Returns: {
          cantidad_pagado: number
          cantidad_parcial: number
          cantidad_pendiente: number
          total_facturado: number
          total_pagado: number
          total_parcial: number
          total_pendiente: number
        }[]
      }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
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
