-- Add status field to tech_analysis_reports table
ALTER TABLE tech_analysis_reports ADD COLUMN status TEXT DEFAULT 'completed';

-- Update existing records to 'completed' status
UPDATE tech_analysis_reports SET status = 'completed' WHERE status IS NULL;