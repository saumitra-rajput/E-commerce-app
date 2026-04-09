CREATE DATABASE IF NOT EXISTS ecommerce;
USE ecommerce;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    total DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insert products with reliable working images from Cloudimage (always work)
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Laptop Pro', 'High performance laptop with 16GB RAM, 512GB SSD, Intel i7 processor.', 999.99, 10, 'Electronics', 'https://placehold.co/400x300/6366f1/white?text=Laptop+Pro'),
('Wireless Mouse', 'Ergonomic wireless mouse with RGB lighting, 16000 DPI sensor.', 29.99, 50, 'Accessories', 'https://placehold.co/400x300/10b981/white?text=Wireless+Mouse'),
('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches, anti-ghosting.', 89.99, 30, 'Accessories', 'https://placehold.co/400x300/f59e0b/white?text=Mechanical+Keyboard'),
('USB-C Cable', 'Fast charging USB-C cable, 2m length, braided nylon.', 12.99, 100, 'Cables', 'https://placehold.co/400x300/ef4444/white?text=USB-C+Cable'),
('4K Monitor', '27-inch 4K UHD monitor, IPS panel, 99% sRGB.', 399.99, 15, 'Electronics', 'https://placehold.co/400x300/8b5cf6/white?text=4K+Monitor'),
('Gaming Headset', 'Surround sound gaming headset with noise-canceling mic.', 79.99, 25, 'Gaming', 'https://placehold.co/400x300/ec4899/white?text=Gaming+Headset'),
('Smart Watch', 'Fitness tracker with heart rate monitor, GPS, waterproof.', 199.99, 20, 'Wearables', 'https://placehold.co/400x300/06b6d4/white?text=Smart+Watch'),
('Wireless Earbuds', 'True wireless earbuds with noise cancellation, 24hr battery.', 149.99, 40, 'Audio', 'https://placehold.co/400x300/84cc16/white?text=Wireless+Earbuds'),
('Tablet', '10.5-inch tablet, 128GB storage, retina display.', 329.99, 12, 'Electronics', 'https://placehold.co/400x300/3b82f6/white?text=Tablet'),
('Phone Stand', 'Adjustable aluminum phone stand, foldable, compatible with all.', 19.99, 75, 'Accessories', 'https://placehold.co/400x300/a855f7/white?text=Phone+Stand');
