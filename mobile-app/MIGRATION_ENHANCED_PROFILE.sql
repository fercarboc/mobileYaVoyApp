-- Add new fields to VoyUsers table for enhanced worker profile

-- Add phone number field
ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);

-- Add document fields
ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "document_type" VARCHAR(3) DEFAULT 'NIF' CHECK (document_type IN ('NIF', 'NIE'));

ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "document_number" VARCHAR(20);

-- Add address fields
ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "address" TEXT;

ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(10);

ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "province" VARCHAR(100);

ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "country" VARCHAR(100) DEFAULT 'España';

-- Add verification photo fields
ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "document_photo_url" TEXT;

ALTER TABLE "VoyUsers" 
ADD COLUMN IF NOT EXISTS "selfie_photo_url" TEXT;

-- Create storage bucket for user documents if it doesn't exist
-- Note: This needs to be run in the Supabase Dashboard under Storage > Policies
-- 1. Create bucket named 'user-documents' with public access
-- 2. Add RLS policies:
--    - INSERT policy: Allow authenticated users to upload their own documents
--    - SELECT policy: Allow public read access
--    - UPDATE policy: Allow authenticated users to update their own documents
--    - DELETE policy: Allow authenticated users to delete their own documents

-- Example RLS policies (to be added in Supabase Dashboard):
/*
-- Policy for INSERT
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for SELECT (public read)
CREATE POLICY "Public can view user documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Policy for UPDATE
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for DELETE
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- Add comments to document the new fields
COMMENT ON COLUMN "VoyUsers"."phone" IS 'User phone number';
COMMENT ON COLUMN "VoyUsers"."document_type" IS 'Document type: NIF or NIE';
COMMENT ON COLUMN "VoyUsers"."document_number" IS 'Document number (DNI/NIE)';
COMMENT ON COLUMN "VoyUsers"."address" IS 'Street address';
COMMENT ON COLUMN "VoyUsers"."postal_code" IS 'Postal/ZIP code';
COMMENT ON COLUMN "VoyUsers"."province" IS 'Province/State';
COMMENT ON COLUMN "VoyUsers"."country" IS 'Country';
COMMENT ON COLUMN "VoyUsers"."document_photo_url" IS 'URL to document photo in storage';
COMMENT ON COLUMN "VoyUsers"."selfie_photo_url" IS 'URL to selfie photo in storage';
