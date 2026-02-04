-- Migration to enhance sales table for Bills/Invoicing
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Walk-in Customer',
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Paid';

-- Update the process_sale function to accept these new fields
-- First, drop the old one to avoid signature conflicts
DROP FUNCTION IF EXISTS public.process_sale(BIGINT, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.process_sale(
    p_product_id BIGINT,
    p_quantity INTEGER,
    p_seller_id UUID,
    p_customer_name TEXT DEFAULT 'Walk-in Customer',
    p_payment_method TEXT DEFAULT 'Cash'
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

    -- 5. Insert sale record with new fields
    INSERT INTO public.sales (product_id, seller_id, quantity, total_price, customer_name, payment_method)
    VALUES (p_product_id, p_seller_id, p_quantity, v_total_price, p_customer_name, p_payment_method)
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
