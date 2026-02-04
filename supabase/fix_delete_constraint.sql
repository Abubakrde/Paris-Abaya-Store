-- FIX: Handle product deletion when sales records exist
-- This migration updates the foreign key to allow deleting products
-- while automatically removing their associated sales history.

ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_product_id_fkey;

ALTER TABLE public.sales
ADD CONSTRAINT sales_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;
