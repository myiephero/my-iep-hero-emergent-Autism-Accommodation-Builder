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
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  
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

-- 2. User Events Table (for comprehensive logging)
CREATE TABLE user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Plan Enforcement Logs
CREATE TABLE plan_enforcement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  feature TEXT NOT NULL,
  action TEXT NOT NULL, -- 'upgrade_prompted', 'access_denied', 'feature_used'
  user_plan TEXT NOT NULL,
  required_plan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Billing Events
CREATE TABLE billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'subscription_cancelled'
  stripe_event_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  plan_type TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Email Notifications Queue
CREATE TABLE email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  email_type TEXT NOT NULL, -- 'welcome', 'hero_welcome', 'advocate_match', 'subscription_confirmation'
  recipient_email TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Parent-Advocate Assignments
CREATE TABLE advocate_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advocate_id UUID REFERENCES user_profiles(id) NOT NULL,
  parent_id UUID REFERENCES user_profiles(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  match_score INTEGER DEFAULT 0,
  match_reason TEXT,
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(advocate_id, parent_id)
);

-- 7. Children Profiles (for parents)
CREATE TABLE children_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES user_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  diagnosis_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Accommodation Sessions (updated to reference students)
CREATE TABLE accommodation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Student reference (replaces individual child fields)
  student_id UUID REFERENCES students(id) NOT NULL,
  child_name TEXT NOT NULL, -- kept for backward compatibility
  grade_level TEXT NOT NULL, -- kept for backward compatibility
  
  -- Session data
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

-- 9. Session Comments
CREATE TABLE session_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES accommodation_sessions(id) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  text TEXT NOT NULL,
  accommodation_index INTEGER, -- NULL for general comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Advanced Reviews (Hero Plan)
CREATE TABLE advanced_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES accommodation_sessions(id) NOT NULL,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  review_data JSONB NOT NULL,
  legal_analysis JSONB,
  review_type TEXT DEFAULT 'hero_advanced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Document Vault (Hero Plan)
CREATE TABLE document_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  session_id UUID REFERENCES accommodation_sessions(id),
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  template_data JSONB NOT NULL,
  file_url TEXT, -- For stored PDFs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Autism Profiles (New Feature)
CREATE TABLE autism_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,
  student_id UUID REFERENCES students(id) NOT NULL,
  
  -- Form data sections
  sensory_preferences JSONB DEFAULT '{}',
  communication_style JSONB DEFAULT '{}',
  behavioral_triggers JSONB DEFAULT '{}',
  home_supports TEXT,
  goals TEXT,
  
  -- AI generated content
  generated_profile TEXT,
  profile_type TEXT DEFAULT 'standard', -- standard or hero
  
  -- Sharing and export
  is_shared BOOLEAN DEFAULT false,
  shared_with TEXT[], -- email addresses
  exported_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for autism profiles
CREATE INDEX idx_autism_profiles_user_id ON autism_profiles(user_id);
CREATE INDEX idx_autism_profiles_student_id ON autism_profiles(student_id);
CREATE INDEX idx_autism_profiles_created_at ON autism_profiles(created_at);

-- RLS for autism profiles
ALTER TABLE autism_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own students' profiles
CREATE POLICY "Parents can manage their students' autism profiles" ON autism_profiles 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = autism_profiles.student_id 
    AND students.parent_id = auth.uid()
  )
);

-- Advocates can view assigned students' profiles
CREATE POLICY "Advocates can view assigned students' autism profiles" ON autism_profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM student_advocate_assignments sa
    JOIN students s ON s.id = sa.student_id
    WHERE sa.advocate_id = auth.uid() 
    AND sa.is_active = true
    AND s.id = autism_profiles.student_id
  )
);

-- Update trigger for autism profiles
CREATE TRIGGER update_autism_profiles_updated_at 
BEFORE UPDATE ON autism_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_enforcement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE advocate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_advocate_assignments ENABLE ROW LEVEL SECURITY;
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

-- Students Policies
CREATE POLICY "Parents can view their own students" ON students FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can create students" ON students FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update their own students" ON students FOR UPDATE USING (parent_id = auth.uid());

-- Advocates can view assigned students
CREATE POLICY "Advocates can view assigned students" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM student_advocate_assignments 
    WHERE student_id = students.id AND advocate_id = auth.uid() AND is_active = true
  )
);

-- Student-Advocate Assignment Policies
CREATE POLICY "Parents can manage student advocate assignments" ON student_advocate_assignments 
FOR ALL USING (
  assigned_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM students WHERE id = student_advocate_assignments.student_id AND parent_id = auth.uid())
);

CREATE POLICY "Advocates can view their assignments" ON student_advocate_assignments 
FOR SELECT USING (advocate_id = auth.uid());

-- User Events Policies (users can view their own events)
CREATE POLICY "Users can view their own events" ON user_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can insert events" ON user_events FOR INSERT WITH CHECK (true);

-- Billing Events Policies
CREATE POLICY "Users can view their own billing events" ON billing_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage billing events" ON billing_events FOR ALL WITH CHECK (true);

-- Accommodation Sessions Policies (existing)
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
-- EMAIL NOTIFICATION TRIGGERS
-- ===============================================

-- Function to queue welcome email
CREATE OR REPLACE FUNCTION queue_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_notifications (user_id, email_type, recipient_email, template_data)
  VALUES (
    NEW.id,
    CASE WHEN NEW.plan_type = 'hero' THEN 'hero_welcome' ELSE 'welcome' END,
    NEW.email,
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'plan_type', NEW.plan_type,
      'role', NEW.role
    )
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new user signup
CREATE TRIGGER user_signup_email_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION queue_welcome_email();

-- Function to queue advocate match notification
CREATE OR REPLACE FUNCTION queue_advocate_match_email()
RETURNS TRIGGER AS $$
DECLARE
  advocate_email TEXT;
  advocate_name TEXT;
  parent_name TEXT;
BEGIN
  -- Get advocate details
  SELECT email, first_name || ' ' || last_name INTO advocate_email, advocate_name
  FROM user_profiles WHERE id = NEW.advocate_id;
  
  -- Get parent name
  SELECT first_name || ' ' || last_name INTO parent_name
  FROM user_profiles WHERE id = NEW.parent_id;
  
  -- Queue notification email for advocate
  INSERT INTO email_notifications (user_id, email_type, recipient_email, template_data)
  VALUES (
    NEW.advocate_id,
    'advocate_match',
    advocate_email,
    jsonb_build_object(
      'advocate_name', advocate_name,
      'parent_name', parent_name,
      'match_score', NEW.match_score,
      'match_reason', NEW.match_reason
    )
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new advocate assignment
CREATE TRIGGER advocate_match_email_trigger
  AFTER INSERT ON advocate_assignments
  FOR EACH ROW
  EXECUTE FUNCTION queue_advocate_match_email();

-- Function to log plan enforcement
CREATE OR REPLACE FUNCTION log_plan_enforcement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO plan_enforcement_logs (user_id, feature, action, user_plan, required_plan)
  VALUES (
    NEW.user_id,
    (NEW.event_data->>'feature')::TEXT,
    (NEW.event_data->>'action')::TEXT,
    (NEW.event_data->>'userPlan')::TEXT,
    (NEW.event_data->>'requiredPlan')::TEXT
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for plan enforcement logging
CREATE TRIGGER plan_enforcement_trigger
  AFTER INSERT ON user_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'plan_enforcement')
  EXECUTE FUNCTION log_plan_enforcement();

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_plan_type ON user_profiles(plan_type);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);
CREATE INDEX idx_plan_enforcement_user_feature ON plan_enforcement_logs(user_id, feature);
CREATE INDEX idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_accommodation_sessions_created_by ON accommodation_sessions(created_by);
CREATE INDEX idx_accommodation_sessions_for_parent ON accommodation_sessions(for_parent);
CREATE INDEX idx_accommodation_sessions_created_at ON accommodation_sessions(created_at);
CREATE INDEX idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX idx_advocate_assignments_advocate_parent ON advocate_assignments(advocate_id, parent_id);

-- ===============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ===============================================

-- Note: You'll need to create users in Supabase Auth first, then run these inserts
-- with the actual UUIDs from auth.users

-- Example advocate profiles (replace UUIDs with actual ones)
/*
INSERT INTO user_profiles (id, first_name, last_name, email, role, plan_type, specialization, credentials, rating, experience, availability) VALUES
('00000000-0000-0000-0000-000000000001', 'Maria', 'Gonzalez', 'maria.gonzalez@ieperoo.com', 'advocate', 'hero', 'Autism & Developmental Disabilities', 'M.Ed., Special Education Advocate', 4.9, '8 years', 'high'),
('00000000-0000-0000-0000-000000000002', 'John', 'Thompson', 'john.thompson@ieperoo.com', 'advocate', 'hero', 'IEP Legal Compliance', 'J.D., Education Law', 4.8, '12 years', 'medium');
*/

-- ===============================================
-- EDGE FUNCTIONS FOR EMAIL PROCESSING
-- ===============================================

-- This is a placeholder for Supabase Edge Functions that would process the email queue
-- You would create these functions in the Supabase dashboard under "Edge Functions"

/*
Example Edge Function to process email notifications:

CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS void AS $$
DECLARE
  notification RECORD;
BEGIN
  FOR notification IN 
    SELECT * FROM email_notifications 
    WHERE status = 'pending' 
    ORDER BY created_at 
    LIMIT 10
  LOOP
    -- Send email using Resend, SendGrid, or other email service
    -- Update status based on success/failure
    UPDATE email_notifications 
    SET 
      status = 'sent',
      sent_at = NOW()
    WHERE id = notification.id;
  END LOOP;
END;
$$ language 'plpgsql';
*/

-- ===============================================
-- SETUP INSTRUCTIONS
-- ===============================================

/*
1. Run this SQL in your Supabase SQL editor
2. Set up email templates in your email service provider
3. Create Edge Functions for email processing
4. Set up Stripe webhooks to update billing_events
5. Configure your application environment variables
6. Test the complete flow with sample users
*/