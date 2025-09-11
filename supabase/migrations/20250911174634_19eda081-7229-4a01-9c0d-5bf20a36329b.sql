-- Enable public read access for reference data tables

-- Create policies for species table (reference data - should be publicly readable)
CREATE POLICY "Allow public read access to species" 
ON public.species 
FOR SELECT 
USING (true);

-- Create policies for safety_guidelines table (reference data - should be publicly readable)
CREATE POLICY "Allow public read access to safety guidelines" 
ON public.safety_guidelines 
FOR SELECT 
USING (true);

-- Create policies for rescue_orgs table (reference data - should be publicly readable)
CREATE POLICY "Allow public read access to rescue organizations" 
ON public.rescue_orgs 
FOR SELECT 
USING (true);