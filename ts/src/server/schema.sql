-- DROP TABLE IF EXISTS levels;
-- CREATE TABLE levels (
--     id SERIAL PRIMARY KEY,
--     level_name TEXT,
--     board_height INT NOT NULL,
--     board_width INT NOT NULL,
--     player_home INT NOT NULL,
--     boss_home INT NOT NULL,
--     office INT NOT NULL,
--     squares JSONB,
--     lights JSONB,
--     coffees JSONB,
--     player_optimal_time NUMERIC
-- );
DROP TABLE IF EXISTS next_levels;

CREATE TABLE next_levels (
    level_id INT REFERENCES levels,
    next_level_id INT,
    level_number INT
);

DROP TABLE IF EXISTS races;

CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    user_id INT,
    level_id INT REFERENCES levels,
    outcome TEXT NOT NULL CONSTRAINT valid_outcome CHECK (
        outcome = 'win'
        OR outcome = 'loss'
        OR outcome = 'crash'
    ),
    difficulty TEXT CONSTRAINT valid_difficulty CHECK (
        difficulty = 'easy'
        OR difficulty = 'medium'
        OR difficulty = 'hard'
        OR difficulty IS NULL
    ),
    race_time NUMERIC,
    win_margin NUMERIC,
    player_optimal_time_delta NUMERIC,
    race_date DATE,
    player_color TEXT,
    coffees_consumed JSONB,
    coffees_consumed_count INT,
    red_lights_hit JSONB,
    red_lights_hit_count INT,
    time_in_schoolzone NUMERIC
);