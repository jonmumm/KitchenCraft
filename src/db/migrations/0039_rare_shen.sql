CREATE OR REPLACE FUNCTION trigger_create_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the stored procedure with the new email
    -- Using CALL for a procedure (if it's defined as a procedure)
    CALL create_unique_profile_name(NEW.email);

    -- Return the new record to complete the insert operation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
