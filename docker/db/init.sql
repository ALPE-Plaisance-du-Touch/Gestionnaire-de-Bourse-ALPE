-- Database initialization script for development
-- This runs automatically when the container is first created

-- Ensure proper character set
ALTER DATABASE bourse_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Separate database for the test suite, so running tests never touches dev data.
-- Tests create and drop every table on each run.
CREATE DATABASE IF NOT EXISTS bourse_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON bourse_dev.* TO 'bourse'@'%';
GRANT ALL PRIVILEGES ON bourse_test.* TO 'bourse'@'%';
FLUSH PRIVILEGES;
