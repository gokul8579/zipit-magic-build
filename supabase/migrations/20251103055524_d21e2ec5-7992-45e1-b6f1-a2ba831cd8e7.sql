-- Add cost_price to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Add expected_profit to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS expected_profit NUMERIC DEFAULT 0;

-- Create stock_approval table for inventory management
CREATE TABLE IF NOT EXISTS stock_approval (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  sales_order_id UUID REFERENCES sales_orders(id),
  product_id UUID REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stock_approval
ALTER TABLE stock_approval ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_approval
CREATE POLICY "Users can view their own stock approvals"
  ON stock_approval FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock approvals"
  ON stock_approval FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock approvals"
  ON stock_approval FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock approvals"
  ON stock_approval FOR DELETE
  USING (auth.uid() = user_id);

-- Create department_members table
CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(department_id, employee_id)
);

-- Enable RLS on department_members
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for department_members
CREATE POLICY "Users can view their own department members"
  ON department_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own department members"
  ON department_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own department members"
  ON department_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own department members"
  ON department_members FOR DELETE
  USING (auth.uid() = user_id);

-- Add department_id to attendance for filtering
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Create trigger for updating stock_approval updated_at
CREATE TRIGGER update_stock_approval_updated_at
  BEFORE UPDATE ON stock_approval
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();