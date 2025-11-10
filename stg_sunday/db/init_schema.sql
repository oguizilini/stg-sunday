-- Schema inicial para o sistema de gestão de contratos
-- Compatível com MySQL 5.7 usando latin1 / latin1_swedish_ci

CREATE DATABASE IF NOT EXISTS stg_contracts
  DEFAULT CHARACTER SET latin1
  DEFAULT COLLATE latin1_swedish_ci;

USE stg_contracts;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS contracts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  status ENUM('rascunho','em_negociacao','assinado','em_execucao','encerrado','cancelado') NOT NULL DEFAULT 'rascunho',
  contract_type VARCHAR(191) NULL,
  client_id INT UNSIGNED NULL,
  assigned_user_id INT UNSIGNED NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  value DECIMAL(18,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contracts_status (status),
  KEY idx_contracts_dates (start_date, end_date),
  CONSTRAINT fk_contracts_client_id FOREIGN KEY (client_id) REFERENCES users(id),
  CONSTRAINT fk_contracts_assigned_user_id FOREIGN KEY (assigned_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS contract_phases (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id INT UNSIGNED NOT NULL,
  phase_name VARCHAR(191) NOT NULL,
  phase_order SMALLINT UNSIGNED NOT NULL,
  due_date DATE NULL,
  responsible_user_id INT UNSIGNED NULL,
  status ENUM('pendente','em_andamento','concluida','bloqueada') NOT NULL DEFAULT 'pendente',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contract_phase_order (contract_id, phase_order),
  KEY idx_contract_phases_status (status),
  CONSTRAINT fk_contract_phases_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_phases_responsible_id FOREIGN KEY (responsible_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS documents (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id INT UNSIGNED NOT NULL,
  file_name VARCHAR(191) NOT NULL,
  file_path VARCHAR(191) NOT NULL,
  storage_type ENUM('local','s3','azure','gcp') NOT NULL DEFAULT 'local',
  version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  uploaded_by INT UNSIGNED NOT NULL,
  upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checksum VARCHAR(64) NULL,
  PRIMARY KEY (id),
  KEY idx_documents_contract (contract_id),
  KEY idx_documents_version (contract_id, version),
  CONSTRAINT fk_documents_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id INT UNSIGNED NOT NULL,
  phase_id INT UNSIGNED NULL,
  description VARCHAR(191) NOT NULL,
  details TEXT NULL,
  assigned_to_user_id INT UNSIGNED NULL,
  due_date DATE NULL,
  status ENUM('novo','em_andamento','concluido','cancelado','atrasado') NOT NULL DEFAULT 'novo',
  priority ENUM('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_status (status),
  KEY idx_tasks_due_date (due_date),
  KEY idx_tasks_contract_id (contract_id),
  CONSTRAINT fk_tasks_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_phase_id FOREIGN KEY (phase_id) REFERENCES contract_phases(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_assigned_user_id FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS automations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  trigger_event VARCHAR(191) NOT NULL,
  action VARCHAR(191) NOT NULL,
  conditions TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_automations_trigger (trigger_event),
  CONSTRAINT fk_automations_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ---------------------------------------------------------------------------
-- Quadro Kanban / STG Sunday
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS board (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS board_group (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id INT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  color_hex VARCHAR(12) NOT NULL DEFAULT '#4361EE',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  is_collapsed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_board_group_board (board_id),
  KEY idx_board_group_position (position),
  CONSTRAINT fk_board_group_board FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS board_column (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id INT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  column_type ENUM('text','status','date','people','number','label','client','observation') NOT NULL DEFAULT 'text',
  position INT UNSIGNED NOT NULL DEFAULT 0,
  config_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_board_column_board (board_id),
  KEY idx_board_column_position (position),
  CONSTRAINT fk_board_column_board FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS board_item (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  board_id INT UNSIGNED NOT NULL,
  group_id INT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_board_item_board (board_id),
  KEY idx_board_item_group (group_id),
  KEY idx_board_item_position (position),
  CONSTRAINT fk_board_item_board FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE,
  CONSTRAINT fk_board_item_group FOREIGN KEY (group_id) REFERENCES board_group(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS board_cell (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id INT UNSIGNED NOT NULL,
  column_id INT UNSIGNED NOT NULL,
  raw_value TEXT NULL,
  color_hex VARCHAR(12) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_board_cell (item_id, column_id),
  CONSTRAINT fk_board_cell_item FOREIGN KEY (item_id) REFERENCES board_item(id) ON DELETE CASCADE,
  CONSTRAINT fk_board_cell_column FOREIGN KEY (column_id) REFERENCES board_column(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE IF NOT EXISTS board_cell_comment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cell_id INT UNSIGNED NOT NULL,
  author_id INT UNSIGNED NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_board_cell_comment_cell (cell_id),
  KEY idx_board_cell_comment_author (author_id),
  CONSTRAINT fk_board_cell_comment_cell FOREIGN KEY (cell_id) REFERENCES board_cell(id) ON DELETE CASCADE,
  CONSTRAINT fk_board_cell_comment_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
