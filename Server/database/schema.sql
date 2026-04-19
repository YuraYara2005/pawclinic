-- ============================================
-- PawClinic Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS pawclinic;
USE pawclinic;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'vet') NOT NULL DEFAULT 'staff',
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- OWNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS owners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50),
  breed VARCHAR(100),
  age INT,
  weight DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_species (species)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pet_id INT NOT NULL,
  owner_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason VARCHAR(200) NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled', 'no-show') DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_pet (pet_id),
  INDEX idx_owner (owner_id),
  INDEX idx_date_time (date, time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  supplier VARCHAR(100),
  description TEXT,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_quantity (quantity),
  INDEX idx_expiry (expiry_date),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA WITH VALID BCRYPT HASHES
-- ============================================

-- Email: admin@clinic.com | Password: admin123
INSERT INTO users (email, password_hash, role, name, phone) 
VALUES (
  'admin@clinic.com', 
  '$2b$10$B00Zk/1Uio3Ew4gR9r8/n.rM/lQ1K52Z1lG7r6oX9R0sH7yX/g77K',
  'admin',
  'Dr. Yara (Admin)',
  '1234567890'
);

-- Email: staff@clinic.com | Password: staff123
INSERT INTO users (email, password_hash, role, name, phone) 
VALUES (
  'staff@clinic.com', 
  '$2b$10$y5M43D9xX4I./7i2IWeNveA/T02gV2G0qA52C0oW9Iq2q9j3R5PZe',
  'staff',
  'Staff User',
  '0987654321'
);

INSERT INTO owners (name, email, phone, address) VALUES
('John Smith', 'john.smith@email.com', '555-0101', '123 Main St, Anytown, ST 12345'),
('Sarah Johnson', 'sarah.j@email.com', '555-0102', '456 Oak Ave, Somewhere, ST 12346'),
('Michael Brown', 'mbrown@email.com', '555-0103', '789 Pine Rd, Elsewhere, ST 12347');

INSERT INTO pets (owner_id, name, species, breed, age, weight) VALUES
(1, 'Max', 'Dog', 'Golden Retriever', 5, 32.5),
(1, 'Luna', 'Cat', 'Siamese', 3, 4.2),
(2, 'Charlie', 'Dog', 'Beagle', 2, 12.8),
(3, 'Bella', 'Cat', 'Persian', 4, 5.1),
(3, 'Rocky', 'Dog', 'German Shepherd', 6, 38.0);

INSERT INTO appointments (pet_id, owner_id, date, time, reason, status, notes) VALUES
(1, 1, '2024-12-20', '09:00:00', 'Annual checkup', 'scheduled', 'First visit of the year'),
(2, 1, '2024-12-20', '10:30:00', 'Vaccination', 'scheduled', 'Annual vaccines due'),
(3, 2, '2024-12-21', '14:00:00', 'Follow-up examination', 'scheduled', 'Check healing progress'),
(4, 3, '2024-12-19', '11:00:00', 'Dental cleaning', 'completed', 'Cleaning completed successfully'),
(5, 3, '2024-12-22', '15:30:00', 'Injury assessment', 'scheduled', 'Limping reported');

INSERT INTO inventory (name, category, quantity, unit, unit_price, low_stock_threshold, supplier, description, expiry_date) VALUES
('Dog Vaccine - Rabies', 'Vaccines', 50, 'doses', 25.99, 10, 'VetSupply Co', 'Rabies vaccination for dogs', '2025-06-30'),
('Cat Vaccine - FVRCP', 'Vaccines', 35, 'doses', 22.50, 10, 'VetSupply Co', 'Feline viral rhinotracheitis, calicivirus and panleukopenia', '2025-07-15'),
('Surgical Gloves', 'Medical Supplies', 200, 'pairs', 0.85, 50, 'MedEquip Inc', 'Latex-free surgical gloves size M', NULL),
('Antibiotic - Amoxicillin', 'Medications', 100, 'tablets', 0.35, 20, 'PharmaPet', 'Broad-spectrum antibiotic 250mg', '2025-12-31'),
('Bandages', 'Medical Supplies', 150, 'rolls', 3.50, 30, 'MedEquip Inc', 'Self-adhesive bandages 2 inch', NULL),
('Syringes 10ml', 'Medical Supplies', 500, 'pieces', 0.45, 100, 'MedEquip Inc', 'Disposable syringes with needle', NULL),
('Dog Food - Premium', 'Supplies', 25, 'bags', 45.00, 5, 'PetNutrition Ltd', '15kg premium dry dog food', '2025-03-30'),
('Cat Litter', 'Supplies', 40, 'bags', 12.99, 10, 'PetSupplies Plus', 'Clumping cat litter 10kg', NULL);


UPDATE pawclinic.users 
SET password_hash = '$2b$10$B00Zk/1Uio3Ew4gR9r8/n.rM/lQ1K52Z1lG7r6oX9R0sH7yX/g77K' 
WHERE email = 'admin@pawclinic.com' OR email = 'admin@clinic.com';

