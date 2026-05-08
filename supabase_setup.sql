-- RUN THESE COMMANDS IN THE SUPABASE SQL EDITOR (https://supabase.com/dashboard/project/phylsekfnpbbwravtszf/sql)

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nameTa TEXT,
    price TEXT NOT NULL,
    cat TEXT,
    badge TEXT DEFAULT 'New',
    emoji TEXT DEFAULT '📦',
    bg TEXT DEFAULT 'linear-gradient(135deg,#f5f5f5,#eeeeee)',
    img TEXT, -- Base64 image data
    origin TEXT DEFAULT 'Annai Kitchen Artisan Studio',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    device_id TEXT NOT NULL,
    clerk_id TEXT,
    status TEXT DEFAULT 'new', -- new, preparing, shipped, delivered
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    clerk_id TEXT UNIQUE,
    name TEXT,
    email TEXT,
    photo TEXT,
    device_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for these tables
-- Run this to allow the app to get instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Set up Row Level Security (RLS)
-- These commands allow the web app to read and write data
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON customers FOR SELECT USING (true);

CREATE POLICY "Allow All" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON customers FOR ALL USING (true) WITH CHECK (true);
