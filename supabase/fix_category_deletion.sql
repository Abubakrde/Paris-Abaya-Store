-- FIX: Allow categories to be deleted by making the category column nullable in the products table
-- This migration ensures that the 'ON DELETE SET NULL' constraint works as intended.

ALTER TABLE public.products 
ALTER COLUMN category DROP NOT NULL;

-- Update the foreign key constraint just in case
ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_product_id_fkey;

ALTER TABLE public.sales
ADD CONSTRAINT sales_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;
