ALTER TABLE portfolio_profile
DROP CONSTRAINT IF EXISTS portfolio_profile_u_check,
DROP CONSTRAINT IF EXISTS portfolio_profile_mu_check,
DROP CONSTRAINT IF EXISTS portfolio_profile_r_f_check;

ALTER TABLE portfolio_profile
ADD CONSTRAINT portfolio_profile_u_check CHECK (u >= 0 AND u <= 1),
ADD CONSTRAINT portfolio_profile_mu_check CHECK (mu > -1),
ADD CONSTRAINT portfolio_profile_r_f_check CHECK (r_f > -1);

ALTER TABLE life_stage_profile
DROP CONSTRAINT IF EXISTS life_stage_profile_initial_annual_savings_check;

ALTER TABLE life_stage_profile
ADD CONSTRAINT life_stage_profile_initial_annual_savings_check
CHECK (initial_annual_savings >= 0);

ALTER TABLE life_stage_profile
DROP CONSTRAINT IF EXISTS life_stage_profile_growth_rate_check;

ALTER TABLE life_stage_profile
ADD CONSTRAINT life_stage_profile_growth_rate_check
CHECK (growth_rate > -1);

ALTER TABLE post_ffp_asset
DROP CONSTRAINT IF EXISTS post_ffp_asset_growth_rate_check;

ALTER TABLE post_ffp_asset
ADD CONSTRAINT post_ffp_asset_growth_rate_check
CHECK (growth_rate > -1);

ALTER TABLE post_ffp_asset
DROP CONSTRAINT IF EXISTS post_ffp_asset_initial_annual_income_check;

ALTER TABLE post_ffp_asset
ADD CONSTRAINT post_ffp_asset_initial_annual_income_check
CHECK (initial_annual_income >= 0);