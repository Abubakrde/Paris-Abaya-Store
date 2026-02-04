-- FIX: Drop the incorrect function signature (UUID) if it exists
DROP FUNCTION IF EXISTS public.process_sale(uuid, integer, uuid);

-- Function to process a sale transaction atomically
-- UPDATED: Accepts BIGINT for p_product_id to match existing products table types
CREATE OR REPLACE FUNCTION public.process_sale(
    p_product_id BIGINT,
    p_quantity INTEGER,
    p_seller_id UUID
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

    -- 5. Insert sale record
    -- NOTE: Ensure your 'sales' table 'product_id' column is also BIGINT (or compatible)
    INSERT INTO public.sales (product_id, seller_id, quantity, total_price)
    VALUES (p_product_id, p_seller_id, p_quantity, v_total_price)
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
