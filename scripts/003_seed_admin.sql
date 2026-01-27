-- Create default admin user (password: admin123)
-- Note: In production, use bcrypt to hash passwords
INSERT INTO admin_users (email, password_hash) VALUES
  ('baklavavalencia@gmail.com', '$2a$10$rBV2kSLKJcjGvNmVqM5ZoOYJ5lVZJqKx0gKx1hXYnQXt5VqZnXt5q')
ON CONFLICT DO NOTHING;
