-- EssayForge Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create essays table
CREATE TABLE IF NOT EXISTS essays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Essay',
    content TEXT NOT NULL DEFAULT '',
    word_count INTEGER,
    char_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create essay_versions table for version history
CREATE TABLE IF NOT EXISTS essay_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    essay_id UUID REFERENCES essays(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS essays_user_id_idx ON essays(user_id);
CREATE INDEX IF NOT EXISTS essays_updated_at_idx ON essays(updated_at DESC);
CREATE INDEX IF NOT EXISTS essay_versions_essay_id_idx ON essay_versions(essay_id);
CREATE INDEX IF NOT EXISTS essay_versions_created_at_idx ON essay_versions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for essays table
-- Users can only see their own essays
CREATE POLICY "Users can view their own essays"
    ON essays FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own essays
CREATE POLICY "Users can insert their own essays"
    ON essays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own essays
CREATE POLICY "Users can update their own essays"
    ON essays FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own essays
CREATE POLICY "Users can delete their own essays"
    ON essays FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for essay_versions table
-- Users can view versions of their own essays
CREATE POLICY "Users can view versions of their own essays"
    ON essay_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM essays
            WHERE essays.id = essay_versions.essay_id
            AND essays.user_id = auth.uid()
        )
    );

-- Users can insert versions for their own essays
CREATE POLICY "Users can insert versions for their own essays"
    ON essay_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM essays
            WHERE essays.id = essay_versions.essay_id
            AND essays.user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_essays_updated_at
    BEFORE UPDATE ON essays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to limit versions to last 10 per essay
CREATE OR REPLACE FUNCTION limit_essay_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete old versions, keeping only the latest 10
    DELETE FROM essay_versions
    WHERE essay_id = NEW.essay_id
    AND id NOT IN (
        SELECT id FROM essay_versions
        WHERE essay_id = NEW.essay_id
        ORDER BY created_at DESC
        LIMIT 10
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to limit versions
CREATE TRIGGER limit_versions_trigger
    AFTER INSERT ON essay_versions
    FOR EACH ROW
    EXECUTE FUNCTION limit_essay_versions();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON essays TO authenticated;
GRANT ALL ON essay_versions TO authenticated;
