CREATE TABLE survey_question (
    id            SERIAL PRIMARY KEY,
    code          TEXT NOT NULL UNIQUE,
    category      TEXT NOT NULL,
    question_text TEXT NOT NULL
);

CREATE TABLE survey_response (
    id           SERIAL PRIMARY KEY,
    profile_id   INT NOT NULL UNIQUE
                 REFERENCES profile(id) ON DELETE CASCADE,
    feedback     TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE survey_answer (
    id                 SERIAL PRIMARY KEY,
    survey_response_id INT NOT NULL REFERENCES survey_response(id) ON DELETE CASCADE,
    survey_question_id INT NOT NULL REFERENCES survey_question(id),
    score              SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    UNIQUE (survey_response_id, survey_question_id)
);

CREATE TABLE consent_record (
    id               SERIAL PRIMARY KEY,
    profile_id       INT NOT NULL UNIQUE REFERENCES profile(id) ON DELETE CASCADE,
    consented_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_version  TEXT NOT NULL DEFAULT 'v1'
);
