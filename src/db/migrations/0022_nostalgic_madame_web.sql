-- Custom SQL migration file, put you code below! --- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS popular_tags;

-- Recreate the materialized view without the LIMIT clause
CREATE MATERIALIZED VIEW popular_tags AS
SELECT 
    jsonb_array_elements_text(tags) AS tag, 
    COUNT(*) AS tag_count
FROM 
    recipe
GROUP BY 
    jsonb_array_elements_text(tags)
ORDER BY 
    COUNT(*) DESC;

-- Optionally, refresh the materialized view immediately after creating
REFRESH MATERIALIZED VIEW popular_tags;

-- Recreate the function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_popular_tags()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_tags;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger on the recipe table
DROP TRIGGER IF EXISTS refresh_popular_tags_after_change ON recipe;

CREATE TRIGGER refresh_popular_tags_after_change
AFTER INSERT OR UPDATE ON recipe
FOR EACH ROW
EXECUTE FUNCTION refresh_popular_tags();