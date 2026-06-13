-- Add UPDATE policy for water_intake table
CREATE POLICY "Users can update own water intake"
  ON water_intake
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);