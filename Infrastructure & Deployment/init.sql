-- Establish the shared team accounts
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) UNIQUE NOT NULL,
    cit_balance INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase I: Digital Arena Challenges
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'CP', 'CTF', or 'DATA'
    difficulty INT NOT NULL,
    reward INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    flag_answer VARCHAR(255) NOT NULL
);

-- Phase II: Field Missions
CREATE TABLE missions (
    id SERIAL PRIMARY KEY,
    mission_name VARCHAR(255) NOT NULL,
    entry_cost INT NOT NULL,
    difficulty_stars INT NOT NULL,
    reward INT NOT NULL,
    description TEXT NOT NULL
);

-- The Marketplace Items
CREATE TABLE marketplace (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'HINT', 'INSURANCE', 'BOOST', 'ACCESS'
    cost INT NOT NULL,
    effect_description TEXT NOT NULL
);

-- Track Active and Completed Missions per Team
CREATE TABLE team_missions (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    mission_id INT REFERENCES missions(id),
    status VARCHAR(50) DEFAULT 'PURCHASED', -- 'PURCHASED', 'COMPLETED', 'FAILED'
    has_insurance BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);