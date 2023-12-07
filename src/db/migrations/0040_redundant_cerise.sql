CREATE OR REPLACE PROCEDURE create_unique_profile_name(email_address text)
LANGUAGE plpgsql
AS $$
DECLARE
    base_name text;
    profile_name text;
    unique_seq bigint;
BEGIN
    -- Extract the part before '+' and '@' from the email address
    base_name := split_part(split_part(email_address, '+', 1), '@', 1);

    -- Get the next value from the existing sequence
    unique_seq := nextval('profile_bigserial_seq');

    -- Combine the base name with the unique sequence number, separated by a dash
    profile_name := base_name || '-' || unique_seq;

    -- Insert the unique profile name into the profile table
    INSERT INTO profile (profile_slug, user_id, activated, created_at, serial_num)
    VALUES (profile_name, (SELECT id FROM public.user WHERE email = email_address), false, NOW(), unique_seq);
END;
$$;
