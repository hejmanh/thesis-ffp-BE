ALTER TABLE portfolio_profile
ADD COLUMN IF NOT EXISTS sigma NUMERIC;

ALTER TABLE portfolio_profile
ADD CONSTRAINT portfolio_profile_sigma_check CHECK (sigma >= 0);
