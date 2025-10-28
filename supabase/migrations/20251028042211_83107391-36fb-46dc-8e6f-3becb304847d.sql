-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  po_number VARCHAR NOT NULL,
  vendor_id UUID,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status VARCHAR NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_orders
CREATE POLICY "Users can view their own purchase orders" 
ON public.purchase_orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase orders" 
ON public.purchase_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders" 
ON public.purchase_orders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders" 
ON public.purchase_orders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for purchase_order_items
CREATE POLICY "Users can view purchase order items for their orders" 
ON public.purchase_order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
));

CREATE POLICY "Users can insert purchase order items for their orders" 
ON public.purchase_order_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
));

CREATE POLICY "Users can update purchase order items for their orders" 
ON public.purchase_order_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
));

CREATE POLICY "Users can delete purchase order items for their orders" 
ON public.purchase_order_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM purchase_orders
  WHERE purchase_orders.id = purchase_order_items.purchase_order_id
  AND purchase_orders.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates on purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();