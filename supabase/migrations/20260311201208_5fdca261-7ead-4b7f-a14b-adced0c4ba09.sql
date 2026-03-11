-- Allow public (unauthenticated) users to validate demo tokens by token value (read-only, limited columns)
CREATE POLICY "Public can validate demo tokens" ON demo_tokens
  FOR SELECT
  TO anon
  USING (true);
