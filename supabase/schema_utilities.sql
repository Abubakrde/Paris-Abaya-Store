-- Utility Bills Table
CREATE TABLE IF NOT EXISTS public.utilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL, -- Electricity, Water, Internet, Rent, etc.
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending', -- Paid, Pending, Overdue
    reference_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.utilities ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users
CREATE POLICY "Enable all for authenticated users" ON public.utilities
    FOR ALL USING (auth.role() = 'authenticated');
