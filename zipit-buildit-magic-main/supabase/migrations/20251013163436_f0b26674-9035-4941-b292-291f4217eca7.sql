-- Create enum types for new modules
CREATE TYPE product_type AS ENUM ('goods', 'service');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE call_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
CREATE TYPE call_type AS ENUM ('inbound', 'outbound');

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  sku VARCHAR,
  product_type product_type NOT NULL DEFAULT 'goods',
  description TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  vendor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  company VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  postal_code VARCHAR,
  country VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendors" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendors" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors" ON public.vendors
  FOR DELETE USING (auth.uid() = user_id);

-- Price Books table
CREATE TABLE public.price_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.price_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price books" ON public.price_books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price books" ON public.price_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price books" ON public.price_books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price books" ON public.price_books
  FOR DELETE USING (auth.uid() = user_id);

-- Price Book Items table
CREATE TABLE public.price_book_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_book_id UUID NOT NULL,
  product_id UUID NOT NULL,
  list_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.price_book_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price book items for their price books" ON public.price_book_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.price_books 
    WHERE price_books.id = price_book_items.price_book_id 
    AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert price book items for their price books" ON public.price_book_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.price_books 
    WHERE price_books.id = price_book_items.price_book_id 
    AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can update price book items for their price books" ON public.price_book_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.price_books 
    WHERE price_books.id = price_book_items.price_book_id 
    AND price_books.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete price book items for their price books" ON public.price_book_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.price_books 
    WHERE price_books.id = price_book_items.price_book_id 
    AND price_books.user_id = auth.uid()
  ));

-- Sales Orders table
CREATE TABLE public.sales_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number VARCHAR NOT NULL,
  customer_id UUID,
  deal_id UUID,
  quotation_id UUID,
  status order_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales orders" ON public.sales_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales orders" ON public.sales_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales orders" ON public.sales_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales orders" ON public.sales_orders
  FOR DELETE USING (auth.uid() = user_id);

-- Sales Order Items table
CREATE TABLE public.sales_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sales order items for their orders" ON public.sales_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.sales_orders 
    WHERE sales_orders.id = sales_order_items.sales_order_id 
    AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sales order items for their orders" ON public.sales_order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.sales_orders 
    WHERE sales_orders.id = sales_order_items.sales_order_id 
    AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can update sales order items for their orders" ON public.sales_order_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.sales_orders 
    WHERE sales_orders.id = sales_order_items.sales_order_id 
    AND sales_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete sales order items for their orders" ON public.sales_order_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.sales_orders 
    WHERE sales_orders.id = sales_order_items.sales_order_id 
    AND sales_orders.user_id = auth.uid()
  ));

-- Calls table
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  call_type call_type NOT NULL DEFAULT 'outbound',
  status call_status NOT NULL DEFAULT 'scheduled',
  related_to_type VARCHAR,
  related_to_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls" ON public.calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calls" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calls" ON public.calls
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calls" ON public.calls
  FOR DELETE USING (auth.uid() = user_id);

-- Company Settings table for invoice templates
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  postal_code VARCHAR,
  country VARCHAR,
  website VARCHAR,
  logo_url TEXT,
  tax_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company settings" ON public.company_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings" ON public.company_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings" ON public.company_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings" ON public.company_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_books_updated_at BEFORE UPDATE ON public.price_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();