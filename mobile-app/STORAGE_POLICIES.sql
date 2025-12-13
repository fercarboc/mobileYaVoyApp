-- ========================================
-- POLÍTICAS DE STORAGE PARA user-documents
-- ========================================

-- ELIMINAR todas las políticas existentes
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to user-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update user-documents" ON storage.objects;

-- POLÍTICAS SIMPLIFICADAS (más fáciles de usar)
-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Anyone can upload to user-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents');

-- Permitir acceso público para ver documentos
CREATE POLICY "Anyone can view user-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-documents');

-- Permitir a usuarios autenticados actualizar archivos
CREATE POLICY "Anyone can update user-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-documents')
WITH CHECK (bucket_id = 'user-documents');
