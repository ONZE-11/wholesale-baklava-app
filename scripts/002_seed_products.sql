-- Seed sample baklava products
INSERT INTO products (name_en, name_es, description_en, description_es, image_url, price, unit, min_order_quantity) VALUES
  ('Classic Pistachio Baklava', 'Baklava Clásica de Pistacho', 'Traditional baklava with premium pistachios and honey', 'Baklava tradicional con pistachos premium y miel', '/placeholder.svg?height=400&width=400', 24.99, 'kg', 5),
  ('Walnut Baklava', 'Baklava de Nueces', 'Rich walnut baklava with butter and syrup', 'Baklava rica en nueces con mantequilla y jarabe', '/placeholder.svg?height=400&width=400', 19.99, 'kg', 5),
  ('Cashew Baklava', 'Baklava de Anacardo', 'Delicate baklava filled with cashews', 'Baklava delicada rellena de anacardos', '/placeholder.svg?height=400&width=400', 27.99, 'kg', 5),
  ('Mixed Nuts Baklava', 'Baklava de Frutos Secos Mixtos', 'A blend of pistachios, walnuts, and almonds', 'Una mezcla de pistachos, nueces y almendras', '/placeholder.svg?height=400&width=400', 22.99, 'kg', 5),
  ('Chocolate Baklava', 'Baklava de Chocolate', 'Modern twist with Belgian chocolate layers', 'Versión moderna con capas de chocolate belga', '/placeholder.svg?height=400&width=400', 29.99, 'kg', 5),
  ('Almond Baklava', 'Baklava de Almendras', 'Light and crispy with toasted almonds', 'Ligera y crujiente con almendras tostadas', '/placeholder.svg?height=400&width=400', 21.99, 'kg', 5)
ON CONFLICT DO NOTHING;
