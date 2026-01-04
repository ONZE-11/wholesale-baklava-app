-- Users table with business information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(100),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, documents_requested, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(255) NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_es TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'kg',
  min_order_quantity INTEGER DEFAULT 1,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50), -- stripe, cash
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  order_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User approval history
CREATE TABLE IF NOT EXISTS user_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(50), -- documents_requested, approved, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
