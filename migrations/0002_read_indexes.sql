-- Indexes for the public read paths. Apply once to an existing D1 database.
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_reports_conference_id ON reports(conference_id);
CREATE INDEX IF NOT EXISTS idx_conferences_start_date ON conferences(start_date);
CREATE INDEX IF NOT EXISTS idx_conferences_end_date ON conferences(end_date);
CREATE INDEX IF NOT EXISTS idx_tech_analysis_created_at ON tech_analysis_reports(created_at DESC);
