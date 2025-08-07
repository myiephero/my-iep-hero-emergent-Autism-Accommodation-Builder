-- ===============================================
-- SUPABASE DATABASE SCHEMA FOR IEP HERO
-- ===============================================

-- 1. User Profiles Table (extends Supabase Auth users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'advocate', 'legal_reviewer')),
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'hero')),
  
  -- Advocate specific fields
  specialization TEXT,
  credentials TEXT,
  rating DECIMAL(2,1) DEFAULT 4.0,
  experience TEXT,
  availability TEXT DEFAULT 'medium' CHECK (availability IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  
  -- Parent specific fields  
  assigned_advocate UUID REFERENCES user_profiles(id),
  priority_support BOOLEAN DEFAULT false,
  legal_review_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Parent-Advocate Assignments
CREATE TABLE advocate_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advocate_id UUID REFERENCES user_profiles(id) NOT NULL,
  parent_id UUID REFERENCES user_profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(advocate_id, parent_id)
);

-- 3. Children Profiles (for parents)
CREATE TABLE children_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES user_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  diagnosis_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Accommodation Sessions (updated to work with Supabase)
CREATE TABLE accommodation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  diagnosis_areas TEXT[] DEFAULT '{}',
  sensory_preferences TEXT[] DEFAULT '{}',
  behavioral_challenges TEXT[] DEFAULT '{}',
  communication_method TEXT NOT NULL,
  additional_info TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free',
  accommodations JSONB NOT NULL DEFAULT '[]',
  
  -- User relationships
  created_by UUID REFERENCES user_profiles(id) NOT NULL,
  for_parent UUID REFERENCES user_profiles(id) NOT NULL,
  
  -- Session status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved')),
  
  -- Approval tracking
  accommodations_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Session Comments
CREATE TABLE session_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES accommodation_sessions(id) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  text TEXT NOT NULL,
  accommodation_index INTEGER, -- NULL for general comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Advanced Reviews (Hero Plan)
CREATE TABLE advanced_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES accommodation_sessions(id) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  review_data JSONB NOT NULL,
  legal_analysis JSONB,
  review_type TEXT DEFAULT 'hero_advanced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Document Vault (Hero Plan)
CREATE TABLE document_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  session_id UUID REFERENCES accommodation_sessions(id),
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Team Invitations (Hero Plan)
CREATE TABLE team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES accommodation_sessions(id) NOT NULL,
  invited_by UUID REFERENCES user_profiles(id) NOT NULL,
  invite_email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'commenter', 'editor')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE children_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow advocates to view their assigned parents
CREATE POLICY "Advocates can view assigned parents" ON user_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM advocate_assignments 
    WHERE advocate_id = auth.uid() AND parent_id = user_profiles.id AND is_active = true
  )
);

-- Accommodation Sessions Policies
CREATE POLICY "Users can view their own sessions" ON accommodation_sessions FOR SELECT USING (
  created_by = auth.uid() OR for_parent = auth.uid()
);

CREATE POLICY "Users can create sessions" ON accommodation_sessions FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own sessions" ON accommodation_sessions FOR UPDATE USING (
  created_by = auth.uid() OR for_parent = auth.uid()
);

-- Advocates can view sessions for their assigned parents
CREATE POLICY "Advocates can view assigned parent sessions" ON accommodation_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM advocate_assignments 
    WHERE advocate_id = auth.uid() AND parent_id = accommodation_sessions.for_parent AND is_active = true
  )
);

-- Session Comments Policies
CREATE POLICY "Users can view comments on accessible sessions" ON session_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM accommodation_sessions 
    WHERE id = session_comments.session_id 
    AND (created_by = auth.uid() OR for_parent = auth.uid())
  )
);

CREATE POLICY "Users can create comments" ON session_comments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodation_sessions_updated_at BEFORE UPDATE ON accommodation_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- SAMPLE DATA (FOR DEVELOPMENT)
-- ===============================================

-- Insert sample advocates (you'll need to create these users in Supabase Auth first)
-- INSERT INTO user_profiles (id, first_name, last_name, email, role, plan_type, specialization, credentials, rating, experience, availability) VALUES
-- ('advocate-uuid-1', 'Maria', 'Gonzalez', 'maria.gonzalez@ieperoo.com', 'advocate', 'hero', 'Autism & Developmental Disabilities', 'M.Ed., Special Education Advocate', 4.9, '8 years', 'high'),
-- ('advocate-uuid-2', 'John', 'Thompson', 'john.thompson@ieperoo.com', 'advocate', 'hero', 'IEP Legal Compliance', 'J.D., Education Law', 4.8, '12 years', 'medium');

-- Insert sample parents
-- INSERT INTO user_profiles (id, first_name, last_name, email, role, plan_type, assigned_advocate) VALUES
-- ('parent-uuid-1', 'Sarah', 'Johnson', 'sarah.johnson@example.com', 'parent', 'free', 'advocate-uuid-1'),
-- ('parent-uuid-2', 'Mike', 'Chen', 'mike.chen@example.com', 'parent', 'hero', 'advocate-uuid-1');

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_plan_type ON user_profiles(plan_type);
CREATE INDEX idx_accommodation_sessions_created_by ON accommodation_sessions(created_by);
CREATE INDEX idx_accommodation_sessions_for_parent ON accommodation_sessions(for_parent);
CREATE INDEX idx_accommodation_sessions_created_at ON accommodation_sessions(created_at);
CREATE INDEX idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX idx_advocate_assignments_advocate_parent ON advocate_assignments(advocate_id, parent_id);

-- ===============================================
-- NOTES FOR SETUP
-- ===============================================

/*
1. Run this SQL in your Supabase SQL editor
2. Create test users through Supabase Auth UI or signup flow
3. The user_profiles table will be populated when users sign up through the app
4. RLS policies ensure users can only access their own data and assigned relationships
5. Advocates can only see data for parents assigned to them
6. Hero Plan features are gated by the plan_type field in user_profiles
*/