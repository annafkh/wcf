-- Select your database in phpMyAdmin, then import this file.
-- Does not drop or overwrite existing records.
CREATE TABLE IF NOT EXISTS wcf_records (
  name VARCHAR(40) NOT NULL PRIMARY KEY,
  payload LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
