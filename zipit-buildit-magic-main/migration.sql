-- ============================================
-- INNER SALES HUB - COMPLETE DATABASE MIGRATION
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create tables
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  interest_level INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'enquiry',
  value DECIMAL(12,2),
  probability INTEGER,
  expected_close_date DATE,
  notes TEXT,
  customer_id UUID REFERENCES public.customers(id),
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  related_to_type TEXT,
  related_to_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration INTEGER,
  notes TEXT,
  related_to_type TEXT,
  related_to_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  category TEXT,
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2),
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER,
  tax_rate DECIMAL(5,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quotation_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  deal_id UUID REFERENCES public.deals(id),
  issue_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2),
  discount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  quotation_id UUID REFERENCES public.quotations(id),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2),
  discount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_book_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES public.price_books(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(price_book_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paper_type TEXT NOT NULL,
  title TEXT NOT NULL,
  reference_number TEXT,
  customer_id UUID REFERENCES public.customers(id),
  vendor_id UUID REFERENCES public.vendors(id),
  date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2),
  status TEXT DEFAULT 'pending',
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  opening_stock DECIMAL(12,2) DEFAULT 0,
  closing_stock DECIMAL(12,2) DEFAULT 0,
  sales_amount DECIMAL(12,2) DEFAULT 0,
  expense_amount DECIMAL(12,2) DEFAULT 0,
  income_amount DECIMAL(12,2) DEFAULT 0,
  number_of_sales INTEGER DEFAULT 0,
  number_of_purchases INTEGER DEFAULT 0,
  cash_in_hand DECIMAL(12,2) DEFAULT 0,
  bank_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- HR MANAGEMENT TABLES
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  head_count INTEGER DEFAULT 0,
  budget DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department_id UUID REFERENCES public.departments(id),
  position TEXT,
  hire_date DATE,
  termination_date DATE,
  salary DECIMAL(12,2),
  status TEXT DEFAULT 'active',
  address TEXT,
  emergency_contact TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  aadhar_number TEXT,
  pan_number TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  bank_ifsc TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, employee_code)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  allowances DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.recruitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  position_count INTEGER DEFAULT 1,
  job_description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'open',
  posted_date DATE DEFAULT CURRENT_DATE,
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id UUID NOT NULL REFERENCES public.recruitment(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  application_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'received',
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  trainer_name TEXT,
  start_date DATE,
  end_date DATE,
  duration_hours INTEGER,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT false,
  completion_status TEXT DEFAULT 'pending',
  feedback TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(training_id, employee_id)
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id UUID,
  overall_rating INTEGER,
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  published_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table for admin management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_book_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (User can access their own data)
-- Leads
CREATE POLICY "Users can view their own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- Customers
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Deals
CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

-- Tasks
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Calls
CREATE POLICY "Users can view their own calls" ON public.calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calls" ON public.calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calls" ON public.calls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calls" ON public.calls FOR DELETE USING (auth.uid() = user_id);

-- Products
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Vendors
CREATE POLICY "Users can view their own vendors" ON public.vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vendors" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vendors" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vendors" ON public.vendors FOR DELETE USING (auth.uid() = user_id);

-- Quotations
CREATE POLICY "Users can view their own quotations" ON public.quotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quotations" ON public.quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotations" ON public.quotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotations" ON public.quotations FOR DELETE USING (auth.uid() = user_id);

-- Quotation Items (inherit from quotations)
CREATE POLICY "Users can view quotation items" ON public.quotation_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY "Users can insert quotation items" ON public.quotation_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY "Users can update quotation items" ON public.quotation_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY "Users can delete quotation items" ON public.quotation_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));

-- Sales Orders
CREATE POLICY "Users can view their own sales orders" ON public.sales_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sales orders" ON public.sales_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales orders" ON public.sales_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales orders" ON public.sales_orders FOR DELETE USING (auth.uid() = user_id);

-- Sales Order Items (inherit from sales_orders)
CREATE POLICY "Users can view sales order items" ON public.sales_order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()));
CREATE POLICY "Users can insert sales order items" ON public.sales_order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()));
CREATE POLICY "Users can update sales order items" ON public.sales_order_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()));
CREATE POLICY "Users can delete sales order items" ON public.sales_order_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()));

-- Price Books
CREATE POLICY "Users can view their own price books" ON public.price_books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own price books" ON public.price_books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own price books" ON public.price_books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own price books" ON public.price_books FOR DELETE USING (auth.uid() = user_id);

-- Price Book Items (inherit from price_books)
CREATE POLICY "Users can view price book items" ON public.price_book_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()));
CREATE POLICY "Users can insert price book items" ON public.price_book_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()));
CREATE POLICY "Users can update price book items" ON public.price_book_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()));
CREATE POLICY "Users can delete price book items" ON public.price_book_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()));

-- Papers
CREATE POLICY "Users can view their own papers" ON public.papers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own papers" ON public.papers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own papers" ON public.papers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own papers" ON public.papers FOR DELETE USING (auth.uid() = user_id);

-- Daily Logs
CREATE POLICY "Users can view their own daily logs" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily logs" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily logs" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily logs" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- Company Settings
CREATE POLICY "Users can view their own company settings" ON public.company_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own company settings" ON public.company_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company settings" ON public.company_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company settings" ON public.company_settings FOR DELETE USING (auth.uid() = user_id);

-- HR Tables RLS Policies
-- Departments
CREATE POLICY "Users can view their own departments" ON public.departments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own departments" ON public.departments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own departments" ON public.departments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own departments" ON public.departments FOR DELETE USING (auth.uid() = user_id);

-- Employees
CREATE POLICY "Users can view their own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own employees" ON public.employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own employees" ON public.employees FOR DELETE USING (auth.uid() = user_id);

-- Attendance
CREATE POLICY "Users can view attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update attendance" ON public.attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete attendance" ON public.attendance FOR DELETE USING (auth.uid() = user_id);

-- Leave Requests
CREATE POLICY "Users can view leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert leave requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update leave requests" ON public.leave_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete leave requests" ON public.leave_requests FOR DELETE USING (auth.uid() = user_id);

-- Leave Balance
CREATE POLICY "Users can view leave balance" ON public.leave_balance FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = leave_balance.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can insert leave balance" ON public.leave_balance FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = leave_balance.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can update leave balance" ON public.leave_balance FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = leave_balance.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can delete leave balance" ON public.leave_balance FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = leave_balance.employee_id AND employees.user_id = auth.uid()));

-- Payroll
CREATE POLICY "Users can view payroll" ON public.payroll FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert payroll" ON public.payroll FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update payroll" ON public.payroll FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete payroll" ON public.payroll FOR DELETE USING (auth.uid() = user_id);

-- Recruitment
CREATE POLICY "Users can view recruitment" ON public.recruitment FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert recruitment" ON public.recruitment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update recruitment" ON public.recruitment FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete recruitment" ON public.recruitment FOR DELETE USING (auth.uid() = user_id);

-- Job Applications
CREATE POLICY "Users can view job applications" ON public.job_applications FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.recruitment WHERE recruitment.id = job_applications.recruitment_id AND recruitment.user_id = auth.uid()));
CREATE POLICY "Users can insert job applications" ON public.job_applications FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.recruitment WHERE recruitment.id = job_applications.recruitment_id AND recruitment.user_id = auth.uid()));
CREATE POLICY "Users can update job applications" ON public.job_applications FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.recruitment WHERE recruitment.id = job_applications.recruitment_id AND recruitment.user_id = auth.uid()));
CREATE POLICY "Users can delete job applications" ON public.job_applications FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.recruitment WHERE recruitment.id = job_applications.recruitment_id AND recruitment.user_id = auth.uid()));

-- Training Programs
CREATE POLICY "Users can view training programs" ON public.training_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert training programs" ON public.training_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update training programs" ON public.training_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete training programs" ON public.training_programs FOR DELETE USING (auth.uid() = user_id);

-- Training Attendance
CREATE POLICY "Users can view training attendance" ON public.training_attendance FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.training_programs WHERE training_programs.id = training_attendance.training_id AND training_programs.user_id = auth.uid()));
CREATE POLICY "Users can insert training attendance" ON public.training_attendance FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.training_programs WHERE training_programs.id = training_attendance.training_id AND training_programs.user_id = auth.uid()));
CREATE POLICY "Users can update training attendance" ON public.training_attendance FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.training_programs WHERE training_programs.id = training_attendance.training_id AND training_programs.user_id = auth.uid()));
CREATE POLICY "Users can delete training attendance" ON public.training_attendance FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.training_programs WHERE training_programs.id = training_attendance.training_id AND training_programs.user_id = auth.uid()));

-- Performance Reviews
CREATE POLICY "Users can view performance reviews" ON public.performance_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert performance reviews" ON public.performance_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update performance reviews" ON public.performance_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete performance reviews" ON public.performance_reviews FOR DELETE USING (auth.uid() = user_id);

-- Employee Documents
CREATE POLICY "Users can view employee documents" ON public.employee_documents FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = employee_documents.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can insert employee documents" ON public.employee_documents FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = employee_documents.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can update employee documents" ON public.employee_documents FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = employee_documents.employee_id AND employees.user_id = auth.uid()));
CREATE POLICY "Users can delete employee documents" ON public.employee_documents FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.employees WHERE employees.id = employee_documents.employee_id AND employees.user_id = auth.uid()));

-- Announcements
CREATE POLICY "Users can view announcements" ON public.announcements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert announcements" ON public.announcements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update announcements" ON public.announcements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete announcements" ON public.announcements FOR DELETE USING (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
