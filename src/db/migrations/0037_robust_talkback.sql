CREATE OR REPLACE FUNCTION trigger_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Call your stored procedure with the new email
    PERFORM create_unique_profile_name(NEW.email);

    -- Return the new record to finish the insert operation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION trigger_create_profile();
