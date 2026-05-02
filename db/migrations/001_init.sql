CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- AUTH & USER
CREATE TABLE user_account (
    id          SERIAL PRIMARY KEY,
    uid         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credential (
    id                  SERIAL PRIMARY KEY,
    user_account_id     INT NOT NULL UNIQUE
                        REFERENCES user_account(id) ON DELETE CASCADE,

    email               TEXT NOT NULL UNIQUE,
    hashed_password     TEXT NOT NULL,
    is_email_verified   BOOLEAN NOT NULL DEFAULT false,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX unique_email_lower ON credential(LOWER(email));

-- TOKENS
CREATE TABLE refresh_token (
    id              SERIAL PRIMARY KEY,
    user_account_id INT NOT NULL
                    REFERENCES user_account(id) ON DELETE CASCADE,

    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT false,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_token_user ON refresh_token(user_account_id);

CREATE TABLE email_verification_token (
    id              SERIAL PRIMARY KEY,
    user_account_id INT NOT NULL
                    REFERENCES user_account(id) ON DELETE CASCADE,

    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION expire_old_email_verification_tokens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE email_verification_token
    SET used_at = NOW()
    WHERE user_account_id = NEW.user_account_id
      AND used_at IS NULL
      AND expires_at <= NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expire_old_email_verification_tokens
BEFORE INSERT ON email_verification_token
FOR EACH ROW
EXECUTE FUNCTION expire_old_email_verification_tokens();

CREATE UNIQUE INDEX uq_email_token_active ON email_verification_token(user_account_id)
WHERE used_at IS NULL;

-- LOOKUP TABLE
CREATE TABLE currency (
    id SERIAL PRIMARY KEY,
    code TEXT
);

ALTER TABLE currency
ALTER COLUMN code SET NOT NULL;

ALTER TABLE currency
ADD CONSTRAINT uq_currency_code UNIQUE (code);

CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT,
    currency_id INT REFERENCES currency(id)
);

CREATE TABLE sex_type (
    id SERIAL PRIMARY KEY,
    code TEXT  UNIQUE,
    title TEXT
);

CREATE TABLE asset_type (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT
);

CREATE TABLE scenario_type (
    id SERIAL PRIMARY KEY,
    no INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE life_stage_range (
    id SERIAL PRIMARY KEY,
    stage_no INT,
    title TEXT NOT NULL,
    beginning_age INT,
    ending_age INT
);

-- PROFILE
CREATE TABLE profile (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    user_account_id INT NOT NULL UNIQUE
        REFERENCES user_account(id) ON DELETE CASCADE,

    birth_year INT,
    current_savings NUMERIC,

    desired_life_expectancy INT,
    estimated_life_expectancy INT,

    country_id INT REFERENCES country(id),
    sex_type_id INT REFERENCES sex_type(id)
);

-- PORTFOLIO PROFILE
CREATE TABLE portfolio_profile (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    profile_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('PRE_FFP', 'POST_FFP')),

    u NUMERIC CHECK (u >= 0 AND u <= 1),
    mu NUMERIC CHECK (mu >= 0),
    r_f NUMERIC CHECK (r_f >= 0)
);

CREATE UNIQUE INDEX uq_portfolio_profile_type ON portfolio_profile(profile_id, type);

-- HABITS
CREATE TABLE smoking_type (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT,
    adjustment_years NUMERIC
);

CREATE TABLE physical_activity_type (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT,
    adjustment_years NUMERIC
);

CREATE TABLE diet_quality_type (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT,
    adjustment_years NUMERIC
);

CREATE TABLE alcohol_consumption_type (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT,
    adjustment_years NUMERIC
);

CREATE TABLE habits_profile (
    id SERIAL PRIMARY KEY,

    profile_id INT NOT NULL UNIQUE
        REFERENCES profile(id) ON DELETE CASCADE,

    smoking_type_id INT REFERENCES smoking_type(id),
    physical_activity_type_id INT REFERENCES physical_activity_type(id),
    diet_quality_type_id INT REFERENCES diet_quality_type(id),
    alcohol_consumption_type_id INT REFERENCES alcohol_consumption_type(id)
);

-- LIFE EXPECTANCY DATA
CREATE TABLE life_expectancy_estimation (
    id SERIAL PRIMARY KEY,
    age NUMERIC,

    country_id INT REFERENCES country(id),
    sex_type_id INT REFERENCES sex_type(id),
    CONSTRAINT uq_life_expectancy_country_sex UNIQUE (country_id, sex_type_id)
);

-- LIFE STAGES PROFILE
CREATE TABLE life_stage_profile (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    profile_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    life_stage_range_id INT NOT NULL REFERENCES life_stage_range(id),

    initial_annual_savings NUMERIC,
    growth_rate NUMERIC,
    CONSTRAINT uq_life_stage_profile_profile_range UNIQUE (profile_id, life_stage_range_id)
);

-- POST-FFP ASSETS
CREATE TABLE post_ffp_asset (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    profile_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    asset_type_id INT REFERENCES asset_type(id),

    initial_annual_income NUMERIC,
    growth_rate NUMERIC
);

-- SCENARIO HAS BEEN TRIED
CREATE TABLE scenario (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    profile_id INT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    scenario_type_id INT NOT NULL REFERENCES scenario_type(id)
);

-- SCENARIO SUBTYPES
CREATE TABLE scenario_1 (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL UNIQUE REFERENCES scenario(id) ON DELETE CASCADE,

    input_ffp_age INT,
    input_ffp_annual_spending NUMERIC,
    output_is_achievable BOOLEAN
);

CREATE TABLE scenario_2 (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL UNIQUE REFERENCES scenario(id) ON DELETE CASCADE,

    input_ffp_annual_spending NUMERIC,
    output_ffp_age INT
);

CREATE TABLE scenario_3 (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL UNIQUE REFERENCES scenario(id) ON DELETE CASCADE,

    input_ffp_age INT,
    output_ffp_annual_spending NUMERIC
);

CREATE TABLE scenario_4 (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL UNIQUE REFERENCES scenario(id) ON DELETE CASCADE,

    input_ffp_age INT,
    output_annual_saving NUMERIC
);