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
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          related_to_id: string | null
          related_to_type: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_to_id?: string | null
          related_to_type?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_to_id?: string | null
          related_to_type?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          call_type: Database["public"]["Enums"]["call_type"]
          created_at: string | null
          duration: number | null
          id: string
          notes: string | null
          outcome: string | null
          related_to_id: string | null
          related_to_type: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          call_type?: Database["public"]["Enums"]["call_type"]
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          call_type?: Database["public"]["Enums"]["call_type"]
          created_at?: string | null
          duration?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          quotation_template: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          quotation_template?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          quotation_template?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          bank_balance: number | null
          cash_in_hand: number | null
          closing_stock: number | null
          created_at: string | null
          expense_amount: number | null
          id: string
          income_amount: number | null
          log_date: string
          notes: string | null
          number_of_purchases: number | null
          number_of_sales: number | null
          opening_stock: number | null
          sales_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_balance?: number | null
          cash_in_hand?: number | null
          closing_stock?: number | null
          created_at?: string | null
          expense_amount?: number | null
          id?: string
          income_amount?: number | null
          log_date?: string
          notes?: string | null
          number_of_purchases?: number | null
          number_of_sales?: number | null
          opening_stock?: number | null
          sales_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_balance?: number | null
          cash_in_hand?: number | null
          closing_stock?: number | null
          created_at?: string | null
          expense_amount?: number | null
          id?: string
          income_amount?: number | null
          log_date?: string
          notes?: string | null
          number_of_purchases?: number | null
          number_of_sales?: number | null
          opening_stock?: number | null
          sales_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          customer_id: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          probability: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_of_department: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_of_department?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          emergency_contact: string | null
          employee_code: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          position: string | null
          salary: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_code?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_code?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          interest_level: number | null
          name: string
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interest_level?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          interest_level?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      papers: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string | null
          deductions: number | null
          employee_id: string
          id: string
          month: number
          net_salary: number
          notes: string | null
          payment_date: string | null
          status: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          created_at?: string | null
          deductions?: number | null
          employee_id: string
          id?: string
          month: number
          net_salary: number
          notes?: string | null
          payment_date?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string | null
          deductions?: number | null
          employee_id?: string
          id?: string
          month?: number
          net_salary?: number
          notes?: string | null
          payment_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      price_book_items: {
        Row: {
          created_at: string | null
          id: string
          list_price: number
          price_book_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_price: number
          price_book_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_price?: number
          price_book_id?: string
          product_id?: string
        }
        Relationships: []
      }
      price_books: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_catalogues: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          catalogue: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity_in_stock: number | null
          reorder_level: number | null
          sku: string | null
          unit_price: number
          updated_at: string | null
          user_id: string
          vendor_id: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          catalogue?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity_in_stock?: number | null
          reorder_level?: number | null
          sku?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id: string
          vendor_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          catalogue?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity_in_stock?: number | null
          reorder_level?: number | null
          sku?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string
          vendor_id?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          product_id: string | null
          purchase_order_id: string
          quantity: number
          tax_amount: number
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          product_id?: string | null
          purchase_order_id: string
          quantity?: number
          tax_amount?: number
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          tax_amount?: number
          unit_price?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          discount_amount: number
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          amount: number
          cgst_amount: number | null
          created_at: string | null
          description: string
          id: string
          quantity: number
          quotation_id: string
          sgst_amount: number | null
          unit_price: number
        }
        Insert: {
          amount: number
          cgst_amount?: number | null
          created_at?: string | null
          description: string
          id?: string
          quantity?: number
          quotation_id: string
          sgst_amount?: number | null
          unit_price: number
        }
        Update: {
          amount?: number
          cgst_amount?: number | null
          created_at?: string | null
          description?: string
          id?: string
          quantity?: number
          quotation_id?: string
          sgst_amount?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          cgst_percent: number | null
          created_at: string | null
          customer_id: string | null
          deal_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          quotation_number: string
          sgst_percent: number | null
          status: Database["public"]["Enums"]["quotation_status"]
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          cgst_percent?: number | null
          created_at?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          quotation_number: string
          sgst_percent?: number | null
          status?: Database["public"]["Enums"]["quotation_status"]
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          cgst_percent?: number | null
          created_at?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          quotation_number?: string
          sgst_percent?: number | null
          status?: Database["public"]["Enums"]["quotation_status"]
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          amount: number
          cgst_amount: number | null
          created_at: string | null
          description: string
          id: string
          product_id: string
          quantity: number
          sales_order_id: string
          sgst_amount: number | null
          unit_price: number
        }
        Insert: {
          amount: number
          cgst_amount?: number | null
          created_at?: string | null
          description: string
          id?: string
          product_id: string
          quantity?: number
          sales_order_id: string
          sgst_amount?: number | null
          unit_price: number
        }
        Update: {
          amount?: number
          cgst_amount?: number | null
          created_at?: string | null
          description?: string
          id?: string
          product_id?: string
          quantity?: number
          sales_order_id?: string
          sgst_amount?: number | null
          unit_price?: number
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          cgst_percent: number | null
          created_at: string | null
          customer_id: string | null
          deal_id: string | null
          discount_amount: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          quotation_id: string | null
          sgst_percent: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cgst_percent?: number | null
          created_at?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          quotation_id?: string | null
          sgst_percent?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cgst_percent?: number | null
          created_at?: string | null
          customer_id?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          quotation_id?: string | null
          sgst_percent?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_to_id: string | null
          related_to_type: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_to_id?: string | null
          related_to_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_to_id?: string | null
          related_to_type?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          location: string | null
          manager: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          location?: string | null
          manager?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          location?: string | null
          manager?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      call_status: "scheduled" | "completed" | "missed" | "cancelled"
      call_type: "inbound" | "outbound"
      deal_stage:
        | "enquiry"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      lead_source:
        | "call"
        | "walk_in"
        | "website"
        | "referral"
        | "campaign"
        | "other"
      lead_status: "new" | "contacted" | "qualified" | "lost" | "converted"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type: "sick" | "casual" | "vacation" | "unpaid" | "other"
      order_status:
        | "draft"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_type: "goods" | "service"
      quotation_status: "draft" | "sent" | "accepted" | "rejected"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "manager" | "sales_rep"
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
      call_status: ["scheduled", "completed", "missed", "cancelled"],
      call_type: ["inbound", "outbound"],
      deal_stage: [
        "enquiry",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      lead_source: [
        "call",
        "walk_in",
        "website",
        "referral",
        "campaign",
        "other",
      ],
      lead_status: ["new", "contacted", "qualified", "lost", "converted"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: ["sick", "casual", "vacation", "unpaid", "other"],
      order_status: ["draft", "confirmed", "shipped", "delivered", "cancelled"],
      product_type: ["goods", "service"],
      quotation_status: ["draft", "sent", "accepted", "rejected"],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "manager", "sales_rep"],
    },
  },
} as const
