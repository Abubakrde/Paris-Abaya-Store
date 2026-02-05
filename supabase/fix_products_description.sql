-- Comprehensive fix for missing product columns
-- Run this in Supabase SQL Editor

-- 1. Add Description
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add Collection
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS collection TEXT;

-- 3. Add Sizes (Array of text)
-- Supports multiple selections like ['S', 'M', 'L']
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY['Standard'];

-- 4. Comment to user
COMMENT ON COLUMN public.products.sizes IS 'Available sizes for the product: S, M, L, XL, XXL, Standard';
