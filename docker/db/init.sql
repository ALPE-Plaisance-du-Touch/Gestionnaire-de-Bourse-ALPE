-- Database initialization script for development
-- This runs automatically when the container is first created

-- Ensure proper character set
ALTER DATABASE bourse_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON bourse_dev.* TO 'bourse'@'%';
FLUSH PRIVILEGES;
