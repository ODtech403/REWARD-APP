-- Add promotion_url column to campaigns table
-- This stores the direct link, app store URL, or website that users will visit when clicking Play

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS promotion_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.promotion_url IS 'Direct link, app store URL, or website URL that users visit when clicking Play';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_promotion_url ON campaigns(promotion_url) WHERE promotion_url IS NOT NULL;
