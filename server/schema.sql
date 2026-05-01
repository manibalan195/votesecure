-- MSEC Election Portal — Full Schema
-- Run: mysql -u root -pbala719959 votesecure < server/schema.sql

USE votesecure;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS candidate_applications;
DROP TABLE IF EXISTS election_voters;
DROP TABLE IF EXISTS elections;
DROP TABLE IF EXISTS otp_tokens;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(150)  NOT NULL,
  email           VARCHAR(200)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('admin','voter','candidate') DEFAULT 'voter',
  roll_number     VARCHAR(50),
  department      VARCHAR(100),
  year            VARCHAR(20),
  degree          VARCHAR(50),
  gender          ENUM('Male','Female','Prefer not to say'),
  phone           VARCHAR(15),
  hostel_day      ENUM('Hosteller','Day Scholar'),
  avatar_url      VARCHAR(500),
  is_verified     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── OTP TOKENS ──────────────────────────────────────────────────────────────
CREATE TABLE otp_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(10) NOT NULL,
  purpose     ENUM('verify_email','reset_password') DEFAULT 'verify_email',
  expires_at  DATETIME NOT NULL,
  is_used     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ELECTIONS ────────────────────────────────────────────────────────────────
CREATE TABLE elections (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  title                   VARCHAR(300) NOT NULL,
  description             TEXT,
  election_type           VARCHAR(100),
  eligible_departments    TEXT,          -- JSON array or 'ALL'
  eligible_years          TEXT,          -- JSON array or 'ALL'
  status                  ENUM('draft','upcoming','live','ended','cancelled') DEFAULT 'draft',
  start_time              DATETIME NOT NULL,
  end_time                DATETIME NOT NULL,
  candidate_apply_start   DATETIME,
  candidate_apply_end     DATETIME,
  allow_nota              BOOLEAN DEFAULT TRUE,
  results_visible_after   ENUM('live','ended') DEFAULT 'ended',
  created_by              INT NOT NULL,
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ─── CANDIDATE APPLICATIONS ───────────────────────────────────────────────────
CREATE TABLE candidate_applications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  election_id     INT NOT NULL,
  user_id         INT NOT NULL,
  party_name      VARCHAR(200),
  manifesto       TEXT,
  agenda_points   TEXT,          -- JSON array of strings
  photo_url       VARCHAR(500),
  social_links    TEXT,          -- JSON object {instagram, linkedin, twitter}
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  admin_note      VARCHAR(500),
  display_order   INT DEFAULT 0,
  applied_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     DATETIME,
  reviewed_by     INT,
  UNIQUE KEY unique_application (election_id, user_id),
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- ─── ELECTION VOTERS ─────────────────────────────────────────────────────────
CREATE TABLE election_voters (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  user_id     INT NOT NULL,
  has_voted   BOOLEAN DEFAULT FALSE,
  added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_voter (election_id, user_id),
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)
);

-- ─── VOTES (anonymous — no user_id) ──────────────────────────────────────────
CREATE TABLE votes (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  election_id             INT NOT NULL,
  candidate_application_id INT,           -- NULL for NOTA
  is_nota                 BOOLEAN DEFAULT FALSE,
  vote_hash               VARCHAR(64) UNIQUE NOT NULL,
  voted_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (election_id)             REFERENCES elections(id),
  FOREIGN KEY (candidate_application_id) REFERENCES candidate_applications(id)
);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(100) NOT NULL,
  election_id INT,
  user_id     INT,
  details     JSON,
  ip_address  VARCHAR(50),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_votes_election      ON votes(election_id);
CREATE INDEX idx_ev_user             ON election_voters(user_id);
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_ca_election         ON candidate_applications(election_id);
CREATE INDEX idx_ca_user             ON candidate_applications(user_id);
CREATE INDEX idx_elections_status    ON elections(status);

-- ─── SEED: ADMIN ACCOUNT ─────────────────────────────────────────────────────
-- Password will be set by setup script. Placeholder hash here.
INSERT INTO users (full_name, email, password_hash, role, is_verified, is_active)
VALUES ('Admin', 'admin@mepcoeng.ac.in',
  '$2b$10$PLACEHOLDER_REPLACED_BY_SETUP_SCRIPT_DO_NOT_USE',
  'admin', TRUE, TRUE);
