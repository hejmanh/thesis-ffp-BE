-- Fix email verification token function: invalidate all previous unused tokens, not just expired ones
CREATE OR REPLACE FUNCTION expire_old_email_verification_tokens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE email_verification_token
    SET used_at = NOW()
    WHERE user_account_id = NEW.user_account_id
      AND used_at IS NULL
      AND id != NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix email verification trigger: BEFORE -> AFTER so NEW.id is available
DROP TRIGGER IF EXISTS trg_expire_old_email_verification_tokens ON email_verification_token;

CREATE TRIGGER trg_expire_old_email_verification_tokens
AFTER INSERT ON email_verification_token
FOR EACH ROW
EXECUTE FUNCTION expire_old_email_verification_tokens();

-- Password reset token table
CREATE TABLE password_reset_token (
    id              SERIAL PRIMARY KEY,
    credential_id   INT NOT NULL
                    REFERENCES credential(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset token function
CREATE OR REPLACE FUNCTION invalidate_old_password_reset_tokens()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE password_reset_token
    SET used_at = NOW()
    WHERE credential_id = NEW.credential_id
      AND used_at IS NULL
      AND id != NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Password reset token trigger
CREATE TRIGGER trg_invalidate_old_password_reset_tokens
AFTER INSERT ON password_reset_token
FOR EACH ROW
EXECUTE FUNCTION invalidate_old_password_reset_tokens();

-- Only one active password reset token per credential
CREATE UNIQUE INDEX uq_password_reset_active
ON password_reset_token(credential_id)
WHERE used_at IS NULL;