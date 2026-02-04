-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Everyone can read categories
CREATE POLICY "Enable read access for all users" ON public.categories
    FOR SELECT USING (true);

-- Only Admins can insert/update/delete
-- Assuming 'admin' check is done via app metadata or profiles. 
-- For simplicity in this demo, allowing authenticated users to manage (or restrict if simple_admin claim exists)
-- Let's use the same logic as products for now (authenticated can do it, or refined later).
CREATE POLICY "Enable write access for authenticated users" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Seed initial data (safely)
INSERT INTO public.categories (name) VALUES 
('ACCESSORIES'), 
('ELECTRONICS'), 
('FOOTWEAR'), 
('APPAREL')
ON CONFLICT (name) DO NOTHING;

-- 5. Update Products Table to link to Categories
-- We will link via NAME to avoid complex migration of existing data.
-- This ensures that products.category MUST exist in categories.name.
-- ON UPDATE CASCADE means if we rename a category, products update automatically.
ALTER TABLE public.products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category) 
REFERENCES public.categories (name) 
ON UPDATE CASCADE
ON DELETE SET NULL;
