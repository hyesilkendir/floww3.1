-- Migration: Add tevkifat rates to company_settings table
-- Date: 2025-12-09
-- Description: Adds tevkifat_rates JSONB field to company_settings table for withholding tax rates

-- Add tevkifat_rates column to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS tevkifat_rates JSONB DEFAULT '[]'::jsonb;

-- Insert default tevkifat rates for existing companies
UPDATE company_settings 
SET tevkifat_rates = '[
  {
    "id": "1",
    "code": "9/10",
    "numerator": 9,
    "denominator": 10,
    "description": "Mimarlık ve Mühendislik Hizmetleri",
    "isActive": true
  },
  {
    "id": "2", 
    "code": "7/10",
    "numerator": 7,
    "denominator": 10,
    "description": "Yapım İşleri",
    "isActive": true
  },
  {
    "id": "3",
    "code": "1/10",
    "numerator": 1,
    "denominator": 10,
    "description": "Makine, Teçhizat Kiralanması",
    "isActive": true
  },
  {
    "id": "4",
    "code": "2/10",
    "numerator": 2,
    "denominator": 10,
    "description": "Yazılım Hizmetleri",
    "isActive": true
  },
  {
    "id": "5",
    "code": "1/10",
    "numerator": 1,
    "denominator": 10,
    "description": "Taşımacılık Hizmetleri",
    "isActive": true
  }
]'::jsonb
WHERE tevkifat_rates = '[]'::jsonb OR tevkifat_rates IS NULL;

-- Add index for tevkifat_rates JSONB queries
CREATE INDEX IF NOT EXISTS idx_company_settings_tevkifat_rates 
ON company_settings USING GIN (tevkifat_rates);

-- Add comment for documentation
COMMENT ON COLUMN company_settings.tevkifat_rates IS 'JSONB array of withholding tax rates with structure: [{"id": "1", "code": "9/10", "numerator": 9, "denominator": 10, "description": "Service description", "isActive": true}]';

-- Function to validate tevkifat_rates JSONB structure
CREATE OR REPLACE FUNCTION validate_tevkifat_rates(rates JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(rates) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each element has required fields
  RETURN (
    SELECT bool_and(
      item ? 'id' AND
      item ? 'code' AND 
      item ? 'numerator' AND
      item ? 'denominator' AND
      item ? 'description' AND
      item ? 'isActive' AND
      jsonb_typeof(item -> 'numerator') = 'number' AND
      jsonb_typeof(item -> 'denominator') = 'number' AND
      jsonb_typeof(item -> 'isActive') = 'boolean'
    )
    FROM jsonb_array_elements(rates) AS item
  );
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for tevkifat_rates structure
ALTER TABLE company_settings 
ADD CONSTRAINT IF NOT EXISTS check_tevkifat_rates_structure 
CHECK (tevkifat_rates IS NULL OR validate_tevkifat_rates(tevkifat_rates));
