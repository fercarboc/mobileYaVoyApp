--- ========================================
-- TABLAS PARA SISTEMA DE NOTIFICACIONES Y EMERGENCIA
-- ========================================

-- Tabla de Contactos de Emergencia
CREATE TABLE IF NOT EXISTS "VoyEmergencyContacts" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "VoyUsers"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON "VoyEmergencyContacts"(user_id);

-- Tabla de Alertas de Emergencia
CREATE TABLE IF NOT EXISTS "VoyEmergencyAlerts" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "VoyUsers"(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('MANUAL', 'AUTOMATIC', 'FALL_DETECTION', 'PANIC_BUTTON')),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED', 'FALSE_ALARM')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES "VoyUsers"(id)
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON "VoyEmergencyAlerts"(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON "VoyEmergencyAlerts"(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON "VoyEmergencyAlerts"(created_at DESC);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS "VoyNotifications" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "VoyUsers"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'EMERGENCY_ALERT',
    'JOB_UPDATE',
    'JOB_ACCEPTED',
    'JOB_REJECTED',
    'JOB_COMPLETED',
    'NEW_MESSAGE',
    'NEW_APPLICATION',
    'PAYMENT_RECEIVED',
    'PAYMENT_PENDING',
    'SYSTEM_ALERT',
    'PROMOTION',
    'REMINDER'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  related_entity_type TEXT, -- 'JOB', 'APPLICATION', 'PAYMENT', 'ALERT', etc.
  related_entity_id UUID,
  metadata JSONB, -- Datos adicionales en formato JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "VoyNotifications"(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "VoyNotifications"(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON "VoyNotifications"(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "VoyNotifications"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON "VoyNotifications"(user_id, is_read, created_at DESC);

-- Tabla de Respuestas a Alertas de Emergencia
CREATE TABLE IF NOT EXISTS "VoyEmergencyAlertResponses" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES "VoyEmergencyAlerts"(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES "VoyEmergencyContacts"(id) ON DELETE SET NULL,
  responder_name TEXT,
  responder_phone TEXT,
  response_type TEXT NOT NULL CHECK (response_type IN ('ACKNOWLEDGED', 'ON_WAY', 'ARRIVED', 'RESOLVED')),
  response_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Índice para respuestas
CREATE INDEX IF NOT EXISTS idx_emergency_responses_alert_id ON "VoyEmergencyAlertResponses"(alert_id);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_contact_id ON "VoyEmergencyAlertResponses"(contact_id);

-- ========================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================

-- Habilitar RLS en las tablas
ALTER TABLE "VoyEmergencyContacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoyEmergencyAlerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoyNotifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoyEmergencyAlertResponses" ENABLE ROW LEVEL SECURITY;

-- Políticas para VoyEmergencyContacts
-- Los usuarios pueden ver y gestionar sus propios contactos
DROP POLICY IF EXISTS "Users can view own emergency contacts" ON "VoyEmergencyContacts";
CREATE POLICY "Users can view own emergency contacts"
ON "VoyEmergencyContacts"
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own emergency contacts" ON "VoyEmergencyContacts";
CREATE POLICY "Users can insert own emergency contacts"
ON "VoyEmergencyContacts"
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own emergency contacts" ON "VoyEmergencyContacts";
CREATE POLICY "Users can update own emergency contacts"
ON "VoyEmergencyContacts"
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own emergency contacts" ON "VoyEmergencyContacts";
CREATE POLICY "Users can delete own emergency contacts"
ON "VoyEmergencyContacts"
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

-- Políticas para VoyEmergencyAlerts
-- Los usuarios pueden ver y crear sus propias alertas
DROP POLICY IF EXISTS "Users can view own emergency alerts" ON "VoyEmergencyAlerts";
CREATE POLICY "Users can view own emergency alerts"
ON "VoyEmergencyAlerts"
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own emergency alerts" ON "VoyEmergencyAlerts";
CREATE POLICY "Users can insert own emergency alerts"
ON "VoyEmergencyAlerts"
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own emergency alerts" ON "VoyEmergencyAlerts";
CREATE POLICY "Users can update own emergency alerts"
ON "VoyEmergencyAlerts"
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

-- Políticas para VoyNotifications
-- Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON "VoyNotifications";
CREATE POLICY "Users can view own notifications"
ON "VoyNotifications"
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own notifications" ON "VoyNotifications";
CREATE POLICY "Users can update own notifications"
ON "VoyNotifications"
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM "VoyUsers" WHERE auth_user_id = auth.uid()
  )
);

-- Sistema puede insertar notificaciones para cualquier usuario
DROP POLICY IF EXISTS "System can insert notifications" ON "VoyNotifications";
CREATE POLICY "System can insert notifications"
ON "VoyNotifications"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas para VoyEmergencyAlertResponses
-- Los contactos pueden ver y responder a las alertas relacionadas
DROP POLICY IF EXISTS "Anyone can view alert responses" ON "VoyEmergencyAlertResponses";
CREATE POLICY "Anyone can view alert responses"
ON "VoyEmergencyAlertResponses"
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can insert alert responses" ON "VoyEmergencyAlertResponses";
CREATE POLICY "Anyone can insert alert responses"
ON "VoyEmergencyAlertResponses"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- FUNCIONES AUXILIARES
-- ========================================

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "VoyNotifications"
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el conteo de notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM "VoyNotifications"
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar notificaciones antiguas (más de 90 días leídas)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM "VoyNotifications"
  WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para actualizar updated_at en VoyEmergencyContacts
CREATE OR REPLACE FUNCTION update_emergency_contact_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_emergency_contact_timestamp ON "VoyEmergencyContacts";
CREATE TRIGGER trigger_update_emergency_contact_timestamp
BEFORE UPDATE ON "VoyEmergencyContacts"
FOR EACH ROW
EXECUTE FUNCTION update_emergency_contact_timestamp();

-- ========================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ========================================

-- Comentar o eliminar esta sección en producción
/*
-- Insertar tipos de notificaciones de ejemplo
INSERT INTO "VoyNotifications" (user_id, type, title, message, is_read)
SELECT 
  id,
  'SYSTEM_ALERT',
  'Bienvenido a YaVoy',
  'Gracias por registrarte. Completa tu perfil para empezar a recibir trabajos.',
  false
FROM "VoyUsers"
WHERE role = 'WORKER'
LIMIT 5;
*/

-- ========================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE "VoyEmergencyContacts" IS 'Contactos de emergencia de cada usuario (familiares, amigos, etc.)';
COMMENT ON TABLE "VoyEmergencyAlerts" IS 'Registro de alertas de emergencia activadas por usuarios';
COMMENT ON TABLE "VoyNotifications" IS 'Sistema de notificaciones para todos los usuarios';
COMMENT ON TABLE "VoyEmergencyAlertResponses" IS 'Respuestas de los contactos a las alertas de emergencia';
