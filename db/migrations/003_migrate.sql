ALTER TABLE user_account
ADD COLUMN last_login_at TIMESTAMPTZ;

ALTER TABLE profile
ADD COLUMN preferred_currency_id INT,
ADD CONSTRAINT fk_profile_preferred_currency
    FOREIGN KEY (preferred_currency_id)
    REFERENCES currency(id);