
-- 1. Add DELETE policy for water_settings
CREATE POLICY "Users can delete their own water settings"
ON public.water_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. Revoke EXECUTE on SECURITY DEFINER helper functions from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- 3. Realtime authorization: only allow users to subscribe to channels named with their own user id
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can receive their own realtime broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive their own realtime broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = ('user:' || auth.uid()::text))
);
