-- Enable RLS and create policies for users table

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
USING (auth.uid() = auth_id);

-- Policy: Users can insert their own data during registration
CREATE POLICY "Users can insert own data"
ON users
FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);
