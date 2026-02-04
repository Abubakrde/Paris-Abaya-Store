-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Enable read access for authenticated users" ON public.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Update Sales Table to include customer_id and status enhancement
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Paid'; -- Ensure it exists

-- 5. Update process_sale function
DROP FUNCTION IF EXISTS public.process_sale(BIGINT, INTEGER, UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.process_sale(
    p_product_id BIGINT,
    p_quantity INTEGER,
    p_seller_id UUID,
    p_customer_name TEXT DEFAULT 'Walk-in Customer',
    p_payment_method TEXT DEFAULT 'CASH',
    p_customer_id BIGINT DEFAULT NULL,
    p_status TEXT DEFAULT 'Paid'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_price DECIMAL(10, 2);
    v_current_stock INTEGER;
    v_sale_id UUID;
    v_total_price DECIMAL(10, 2);
BEGIN
    -- 1. Get product details and lock the row for update
    SELECT price, stock INTO v_product_price, v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- 2. Validate stock
    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;

    -- 3. Calculate total
    v_total_price := v_product_price * p_quantity;

    -- 4. Decrement stock
    UPDATE public.products
    SET stock = stock - p_quantity
    WHERE id = p_product_id;

    -- 5. Insert sale record with customer data
    INSERT INTO public.sales (
        product_id, 
        seller_id, 
        quantity, 
        total_price, 
        customer_name, 
        payment_method, 
        customer_id, 
        status
    )
    VALUES (
        p_product_id, 
        p_seller_id, 
        p_quantity, 
        v_total_price, 
        p_customer_name, 
        p_payment_method, 
        p_customer_id, 
        p_status
    )
    RETURNING id INTO v_sale_id;

    -- 6. Return success
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'new_stock', v_current_stock - p_quantity,
        'total_price', v_total_price
    );
END;
$$;
