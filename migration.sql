-- Execute this SQL in the Supabase SQL Editor to create the tables

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_completing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tag_id TEXT REFERENCES tags(id) ON DELETE SET NULL,
  commission NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_history (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reply_to TEXT,
  reactions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Restrict to authenticated users only
CREATE POLICY "Auth users only" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users only" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users only" ON project_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users only" ON withdrawals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default tags
INSERT INTO tags (id, name, color, is_completing, created_at) VALUES
  ('tag-1', 'Nao iniciado', '#6b7280', false, NOW()),
  ('tag-2', 'Em andamento', '#3b82f6', false, NOW()),
  ('tag-3', 'Em revisao', '#f59e0b', false, NOW()),
  ('tag-4', 'Concluido', '#22c55e', true, NOW()),
  ('tag-5', 'Cancelado', '#ef4444', false, NOW())
ON CONFLICT (id) DO NOTHING;
