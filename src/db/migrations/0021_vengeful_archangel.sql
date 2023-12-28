-- Custom SQL migration file, put you code below! --
CREATE MATERIALIZED VIEW popular_tags AS
SELECT 
    jsonb_array_elements_text(tags) AS tag, 
    COUNT(*) AS tag_count
FROM 
    recipe
GROUP BY 
    jsonb_array_elements_text(tags)
ORDER BY 
    COUNT(*) DESC
LIMIT 30;

CREATE OR REPLACE FUNCTION refresh_popular_tags()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW popular_tags;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_popular_tags_after_change
AFTER INSERT OR UPDATE ON recipe
FOR EACH ROW
EXECUTE FUNCTION refresh_popular_tags();
