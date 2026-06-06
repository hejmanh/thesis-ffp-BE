ALTER TABLE scenario_3
ADD COLUMN IF NOT EXISTS input_life_expectancy INT;

ALTER TABLE scenario_4
ADD COLUMN IF NOT EXISTS input_life_expectancy INT,
ADD COLUMN IF NOT EXISTS input_ffp_annual_spending NUMERIC;
