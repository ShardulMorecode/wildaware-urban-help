-- Align tables with CSVs for manual data upload
-- 1) species_expanded.csv: common_name, scientific_name, risk_level, keywords, image_ref, source_url
ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS image_ref TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Optional convenience: keep any prior values; no backfill needed

-- 2) safety_guidelines_expanded.csv: species_common_name, dos, donts, first_aid, authority_notes, source_url
ALTER TABLE public.safety_guidelines
  ADD COLUMN IF NOT EXISTS species_common_name TEXT,
  ADD COLUMN IF NOT EXISTS first_aid TEXT,
  ADD COLUMN IF NOT EXISTS authority_notes TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Backfill species_common_name from existing "situation" when empty
UPDATE public.safety_guidelines
SET species_common_name = COALESCE(species_common_name, situation)
WHERE species_common_name IS NULL;

-- 3) rescue_orgs_expanded.csv already matches existing schema
-- Ensure fast lookups by species/name for app queries
CREATE INDEX IF NOT EXISTS idx_species_common_name ON public.species (LOWER(common_name));
CREATE INDEX IF NOT EXISTS idx_safety_guidelines_species_common_name ON public.safety_guidelines (LOWER(species_common_name));
