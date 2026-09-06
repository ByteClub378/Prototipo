CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS players (
  id CHAR(36) PRIMARY KEY,
  public_id CHAR(36) NOT NULL UNIQUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deleted_at TIMESTAMP(3) NULL,
  INDEX idx_players_active (deleted_at, last_seen_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  player_id CHAR(36) NOT NULL,
  token_hash BINARY(32) NOT NULL UNIQUE,
  expires_at TIMESTAMP(3) NOT NULL,
  revoked_at TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_used_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_sessions_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_sessions_player_active (player_id, revoked_at, expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS regions (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS levels (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  region_id VARCHAR(32) NOT NULL,
  level_number SMALLINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  max_score INT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_levels_region FOREIGN KEY (region_id) REFERENCES regions(id),
  UNIQUE KEY uq_level_region_number (region_id, level_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_region_progress (
  player_id CHAR(36) NOT NULL,
  region_id VARCHAR(32) NOT NULL,
  status ENUM('locked','unlocked','completed') NOT NULL DEFAULT 'locked',
  unlocked_at TIMESTAMP(3) NULL,
  completed_at TIMESTAMP(3) NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (player_id, region_id),
  CONSTRAINT fk_prp_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_prp_region FOREIGN KEY (region_id) REFERENCES regions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_level_progress (
  player_id CHAR(36) NOT NULL,
  level_id BIGINT UNSIGNED NOT NULL,
  status ENUM('locked','unlocked','completed') NOT NULL DEFAULT 'locked',
  best_score INT UNSIGNED NOT NULL DEFAULT 0,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP(3) NULL,
  completed_at TIMESTAMP(3) NULL,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (player_id, level_id),
  CONSTRAINT fk_plp_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_plp_level FOREIGN KEY (level_id) REFERENCES levels(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempts (
  id CHAR(36) PRIMARY KEY,
  player_id CHAR(36) NOT NULL,
  level_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  status ENUM('started','completed','abandoned') NOT NULL DEFAULT 'started',
  score INT UNSIGNED NULL,
  correct_answers SMALLINT UNSIGNED NULL,
  incorrect_answers SMALLINT UNSIGNED NULL,
  duration_seconds INT UNSIGNED NULL,
  started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at TIMESTAMP(3) NULL,
  CONSTRAINT fk_attempt_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_level FOREIGN KEY (level_id) REFERENCES levels(id),
  UNIQUE KEY uq_attempt_number (player_id, level_id, attempt_number),
  INDEX idx_attempt_metrics (level_id, status, completed_at),
  INDEX idx_attempt_player_date (player_id, started_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medals (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  region_id VARCHAR(32) NULL,
  criterion_type ENUM('region_complete','level_score') NOT NULL,
  criterion_value INT UNSIGNED NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_medal_region FOREIGN KEY (region_id) REFERENCES regions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_medals (
  player_id CHAR(36) NOT NULL,
  medal_id VARCHAR(64) NOT NULL,
  awarded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (player_id, medal_id),
  CONSTRAINT fk_pm_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_medal FOREIGN KEY (medal_id) REFERENCES medals(id)
) ENGINE=InnoDB;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_initial');
