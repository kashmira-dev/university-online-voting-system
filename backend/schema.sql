-- PostgreSQL DDL Database Schema for University Online Voting System

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) DEFAULT 'student' CHECK (role IN ('student', 'super_admin', 'chief_election_officer', 'voter_manager')),
    faculty VARCHAR(100) NOT NULL,
    year INT DEFAULT 1,
    is_eligible BOOLEAN DEFAULT TRUE,
    has_voted BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS elections (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    faculty_restriction VARCHAR(100) DEFAULT 'All Faculties',
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    total_voters INT DEFAULT 0,
    votes_cast INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    election_id INT REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    manifesto TEXT,
    avatar VARCHAR(255),
    votes_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    election_id INT REFERENCES elections(id) ON DELETE CASCADE,
    candidate_id INT REFERENCES candidates(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_voter_election UNIQUE (user_id, election_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Mock Users
INSERT INTO users (student_id, name, email, role, faculty, year, is_eligible, has_voted, password_hash)
VALUES 
('STU2026001', 'Kasun Perera', 'kasun@university.edu', 'student', 'Faculty of Computing', 2, TRUE, FALSE, '$2a$10$w8T.N0V3yWc6wz4V/Wc.8e8U8Z8X8Y8Z8X8Y8Z8X8Y8Z8X8Y8Z8X8'),
('ADM2026001', 'Dr. Anura Jayawardena', 'admin@university.edu', 'super_admin', 'Administration', 0, FALSE, FALSE, '$2a$10$w8T.N0V3yWc6wz4V/Wc.8e8U8Z8X8Y8Z8X8Y8Z8X8Y8Z8X8Y8Z8X8')
ON CONFLICT (student_id) DO NOTHING;
