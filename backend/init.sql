-- backend/init.sql
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'app123';
GRANT ALL PRIVILEGES ON ecommerce.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
