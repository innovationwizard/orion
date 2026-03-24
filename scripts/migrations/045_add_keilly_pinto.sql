-- Add salesperson: Keilly Pinto
INSERT INTO salespeople (full_name, display_name)
VALUES ('Keilly Pinto', 'Keilly')
ON CONFLICT (full_name) DO NOTHING;
