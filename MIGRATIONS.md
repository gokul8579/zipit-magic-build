# Database Migrations Documentation

This document contains all database migrations for the CRM system. Use these SQL statements to set up the database in any Supabase project.

## Core Tables Setup

### 1. User Roles
```sql
CREATE TYPE user_role AS ENUM ('admin', 'sales_rep', 'manager');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'sales_rep',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

### 2. Leads
```sql
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'email', 'phone', 'other');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source NOT NULL DEFAULT 'other',
  interest_level INTEGER,
  notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  postal_code VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Deals (Pipeline)
```sql
CREATE TYPE deal_stage AS ENUM ('enquiry', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID,
  customer_id UUID,
  title VARCHAR NOT NULL,
  stage deal_stage NOT NULL DEFAULT 'enquiry',
  value NUMERIC,
  probability INTEGER,
  expected_close_date DATE,
  notes TEXT,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deals" ON deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" ON deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" ON deals
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Tasks
```sql
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID,
  related_to_type VARCHAR,
  related_to_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Calls & Meetings
```sql
CREATE TYPE call_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
CREATE TYPE call_type AS ENUM ('call', 'meeting', 'outbound', 'inbound');

CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  call_type call_type NOT NULL DEFAULT 'outbound',
  status call_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  duration INTEGER,
  outcome TEXT,
  notes TEXT,
  related_to_type VARCHAR,
  related_to_id UUID,
  customer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls" ON calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls" ON calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls" ON calls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calls" ON calls
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Products & Inventory
```sql
CREATE TYPE product_type AS ENUM ('goods', 'service');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  sku VARCHAR,
  description TEXT,
  product_type product_type NOT NULL DEFAULT 'goods',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  weight NUMERIC,
  weight_unit VARCHAR DEFAULT 'kg',
  catalogue TEXT,
  vendor_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8. Product Categories & Catalogues
```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories" ON product_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE product_catalogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_catalogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own catalogues" ON product_catalogues
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 9. Price Books
```sql
CREATE TABLE price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price books" ON price_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price books" ON price_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price books" ON price_books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price books" ON price_books
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE price_book_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES price_books(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  list_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_book_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price book items for their price books" ON price_book_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert price book items for their price books" ON price_book_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can update price book items for their price books" ON price_book_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete price book items for their price books" ON price_book_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM price_books WHERE price_books.id = price_book_items.price_book_id AND price_books.user_id = auth.uid()
  ));
```

### 10. Quotations
```sql
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quotation_number VARCHAR NOT NULL,
  customer_id UUID,
  deal_id UUID,
  status quotation_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  cgst_percent NUMERIC DEFAULT 9,
  sgst_percent NUMERIC DEFAULT 9,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotations" ON quotations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotations" ON quotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations" ON quotations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotations" ON quotations
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotation items for their quotations" ON quotation_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert quotation items for their quotations" ON quotation_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update quotation items for their quotations" ON quotation_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete quotation items for their quotations" ON quotation_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()
  ));

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 11. Sales Orders
```sql
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled');

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR NOT NULL,
  quotation_id UUID,
  customer_id UUID,
  deal_id UUID,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status order_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  cgst_percent NUMERIC DEFAULT 9,
  sgst_percent NUMERIC DEFAULT 9,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales orders" ON sales_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales orders" ON sales_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales orders" ON sales_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales orders" ON sales_orders
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales order items for their orders" ON sales_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sales order items for their orders" ON sales_order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sales order items for their orders" ON sales_order_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sales order items for their orders" ON sales_order_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM sales_orders WHERE sales_orders.id = sales_order_items.sales_order_id AND sales_orders.user_id = auth.uid()
  ));

CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 12. Vendors
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  postal_code VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendors" ON vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendors" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" ON vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" ON vendors
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 13. Activities
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR NOT NULL,
  subject VARCHAR,
  description TEXT,
  related_to_type VARCHAR,
  related_to_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);
```

### 14. Company Settings
```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR NOT NULL,
  logo_url TEXT,
  phone VARCHAR,
  email VARCHAR,
  website VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  postal_code VARCHAR,
  tax_id VARCHAR,
  quotation_template TEXT DEFAULT 't1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company settings" ON company_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings" ON company_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings" ON company_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings" ON company_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 15. Daily Logs
```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_stock NUMERIC DEFAULT 0,
  closing_stock NUMERIC DEFAULT 0,
  sales_amount NUMERIC DEFAULT 0,
  number_of_sales INTEGER DEFAULT 0,
  expense_amount NUMERIC DEFAULT 0,
  income_amount NUMERIC DEFAULT 0,
  number_of_purchases INTEGER DEFAULT 0,
  cash_in_hand NUMERIC DEFAULT 0,
  bank_balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 16. HR Management Tables

#### Departments
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  head_of_department VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own departments" ON departments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own departments" ON departments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own departments" ON departments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own departments" ON departments
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Employees
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  position VARCHAR,
  department_id UUID,
  hire_date DATE,
  salary NUMERIC,
  address TEXT,
  emergency_contact VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own employees" ON employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees" ON employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON employees
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Attendance
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON attendance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance" ON attendance
  FOR DELETE USING (auth.uid() = user_id);
```

#### Leave Requests
```sql
CREATE TYPE leave_type AS ENUM ('sick', 'vacation', 'personal', 'unpaid');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leave requests" ON leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leave requests" ON leave_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leave requests" ON leave_requests
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Payroll
```sql
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC NOT NULL,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  payment_date DATE,
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payroll" ON payroll
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payroll" ON payroll
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payroll" ON payroll
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payroll" ON payroll
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 17. Document Storage
```sql
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own papers" ON papers
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 18. Warehouses
```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  location TEXT,
  manager VARCHAR,
  capacity INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warehouses" ON warehouses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warehouses" ON warehouses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses" ON warehouses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses" ON warehouses
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Helper Functions

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

## Storage Buckets

### Papers Bucket
```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('papers', 'papers', false);

-- Create policies for papers bucket
CREATE POLICY "Users can upload their own papers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own papers"
ON storage.objects FOR SELECT
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own papers"
ON storage.objects FOR DELETE
USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Notes

- All tables include `user_id` column for multi-tenant isolation
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data via RLS policies
- Updated timestamps are automatically maintained via triggers
- Foreign key relationships maintain referential integrity
- Proper indexes should be added for performance optimization on large datasets

## Migration Order

1. Create ENUM types first
2. Create helper functions
3. Create core tables (leads, customers, deals, etc.)
4. Create related tables (items, activities, etc.)
5. Enable RLS and create policies
6. Create triggers for timestamp updates
7. Set up storage buckets and policies

## Future Considerations

- Add indexes for frequently queried columns
- Implement soft deletes if needed
- Add audit logging tables
- Consider partitioning for large tables
- Add full-text search capabilities
