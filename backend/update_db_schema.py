from sqlalchemy import text
from db.database import engine
import uuid

def apply_updates():
    print("Checking for missing columns in user_profiles...")
    
    # We'll use raw SQL to add columns if they don't exist
    # PostgreSQL doesn't have "ADD COLUMN IF NOT EXISTS" for older versions, 
    # but we can check existence in information_schema.
    
    commands = [
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS invite_token VARCHAR(100) UNIQUE;",
        "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS approved_domains TEXT[];"        
        # Chatbot Q&A table creation
        """
        CREATE TABLE IF NOT EXISTS chatbot_qa (
            id UUID PRIMARY KEY,
            question VARCHAR(500) NOT NULL UNIQUE,
            answer TEXT NOT NULL,
            keywords TEXT[],
            category VARCHAR(100),
            quick_replies TEXT[],
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0,
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "ALTER TABLE chatbot_qa ALTER COLUMN is_active SET DEFAULT TRUE;",
        "UPDATE chatbot_qa SET is_active = TRUE WHERE is_active IS NULL;",
        
        # Indexes for performance
        "CREATE INDEX IF NOT EXISTS idx_chatbot_qa_keywords ON chatbot_qa USING GIN (keywords);",
        "CREATE INDEX IF NOT EXISTS idx_chatbot_qa_category ON chatbot_qa (category);",
        "CREATE INDEX IF NOT EXISTS idx_chatbot_qa_active ON chatbot_qa (is_active);",
        
        # Insert default Q&A pairs with explicit UUIDs
        f"""
        INSERT INTO chatbot_qa (id, question, answer, keywords, category, quick_replies, sort_order) VALUES
        ('{uuid.uuid4()}', 'How Axiora Pulse works?', 'Axiora Pulse helps you create, design, distribute, analyze, and manage surveys in a branded, team-friendly way, with built-in analytics.', ARRAY['axiora pulse', 'how works', 'survey platform', 'analytics'], 'product-overview', ARRAY['What survey types are supported?', 'How do I create a survey?', 'How do I view analytics?'], 0),

        ('{uuid.uuid4()}', 'How do I create a new survey?', 'To create a survey, go to the dashboard and click **New Survey**. Choose a template or start from scratch, add your questions, configure survey settings, then save and publish when ready.', ARRAY['create', 'survey', 'new', 'start'], 'getting-started', ARRAY['Can I use a template?', 'What question types are available?', 'How do I publish my survey?'], 1),

        ('{uuid.uuid4()}', 'Can I use a template instead of building from scratch?', 'Yes — Axiora Pulse offers templates for common use cases. Select a template on the new survey screen and customize the questions, branding, and behavior.', ARRAY['template', 'templates', 'start', 'quick'], 'getting-started', ARRAY['What templates are available?', 'Can I customize templates?', 'How do I create from scratch?'], 2),

        ('{uuid.uuid4()}', 'How do I edit an existing survey?', 'Open the survey from your survey list, click **Edit**, then update questions, settings, or appearance. Save your changes and republish if you want the live version to update.', ARRAY['edit', 'modify', 'change', 'update'], 'survey-management', ARRAY['Can I edit after publishing?', 'What can I change?', 'How do I save changes?'], 3),

        ('{uuid.uuid4()}', 'What question types can I add?', 'Supported types include short text, long text, single choice, multiple choice, dropdown, rating, yes/no, number, email, date, slider, scale, ranking, and matrix.', ARRAY['questions', 'types', 'supported', 'available'], 'survey-design', ARRAY['How do I add questions?', 'Can I customize question appearance?', 'What''s the difference between types?'], 4),

        ('{uuid.uuid4()}', 'How do I make a question required?', 'When editing a question, enable the **Required** toggle. Respondents will need to answer it before submitting.', ARRAY['required', 'mandatory', 'must', 'answer'], 'survey-design', ARRAY['Can I make all questions required?', 'What happens if required questions are skipped?', 'How do I mark optional questions?'], 5),

        ('{uuid.uuid4()}', 'Can I add conditional logic to my survey?', 'Yes — use conditional logic rules to show or hide questions based on earlier answers, so respondents only see relevant follow-up questions.', ARRAY['conditional', 'logic', 'skip', 'branching'], 'survey-design', ARRAY['How do I set up conditional logic?', 'What types of conditions can I use?', 'Can I have multiple branches?'], 6),

        ('{uuid.uuid4()}', 'How do I customize the survey appearance?', 'In survey settings, adjust theme colors, fonts, logo, and button text so the survey matches your brand. Preview changes before publishing.', ARRAY['customize', 'appearance', 'theme', 'design', 'branding'], 'survey-design', ARRAY['Can I use my logo?', 'What fonts are available?', 'Can I match my brand colors?'], 7),

        ('{uuid.uuid4()}', 'Can I add a welcome message and thank-you page?', 'Yes — set a custom welcome message for respondents when they open the survey, and a thank-you message after submission.', ARRAY['welcome', 'thank', 'message', 'page'], 'survey-design', ARRAY['Can I add images to messages?', 'How do I customize the thank-you page?', 'Can I redirect after completion?'], 8),

        ('{uuid.uuid4()}', 'How do I share my survey link?', 'Use the survey share page to copy the public link. You can also embed the survey in a website, email it to respondents, or generate a QR code.', ARRAY['share', 'distribute', 'send', 'invite', 'link'], 'sharing', ARRAY['Can I embed on website?', 'How do I email invitations?', 'Can I generate QR codes?'], 9),

        ('{uuid.uuid4()}', 'Can I embed the survey on my website?', 'Yes — Axiora Pulse supports embed code. Paste the generated HTML snippet into your site to display the survey inline.', ARRAY['embed', 'website', 'html', 'code', 'inline'], 'sharing', ARRAY['What does embedded survey look like?', 'Can I customize embed appearance?', 'Do embedded responses count?'], 10),

        ('{uuid.uuid4()}', 'Can I restrict who can respond to a survey?', 'Yes — enable response restrictions like email collection or domain whitelisting. You can also set invitations for specific users.', ARRAY['restrict', 'limit', 'access', 'respondents'], 'sharing', ARRAY['How do I collect email addresses?', 'Can I limit responses?', 'How do I send invitations?'], 11),

        ('{uuid.uuid4()}', 'How do I send reminders to respondents?', 'If your plan supports it, use the email reminder feature to resend invitations to people who haven''t completed the survey yet.', ARRAY['reminders', 'follow', 'email', 'resend'], 'sharing', ARRAY['How many reminders can I send?', 'When are reminders sent?', 'Can I customize reminder messages?'], 12),

        ('{uuid.uuid4()}', 'How do I view survey analytics?', 'Open your survey and click **Analytics**. You''ll see response counts, completion rate, average time, question breakdowns, and charts for each metric.', ARRAY['analytics', 'results', 'data', 'view', 'reports'], 'analytics', ARRAY['What metrics are shown?', 'Can I export analytics?', 'How do I filter results?'], 13),

        ('{uuid.uuid4()}', 'Can I export survey results?', 'Yes — export data as CSV, Excel, or PDF from the analytics page. Exports can include raw responses, timestamps, and metadata.', ARRAY['export', 'download', 'data', 'csv', 'excel', 'pdf'], 'analytics', ARRAY['What data is included?', 'Can I automate exports?', 'Are exports secure?'], 14),

        ('{uuid.uuid4()}', 'What metrics are included in analytics?', 'Analytics include total responses, completion rate, abandonment rate, average response time, question-by-question results, and trend data.', ARRAY['metrics', 'statistics', 'data', 'numbers'], 'analytics', ARRAY['How is completion rate calculated?', 'What''s abandonment rate?', 'Can I see trends over time?'], 15),

        ('{uuid.uuid4()}', 'Can I filter responses by date or segment?', 'Yes — use filter controls in the analytics dashboard to narrow results by date, response status, or respondent metadata.', ARRAY['filter', 'segment', 'narrow', 'date', 'group'], 'analytics', ARRAY['What filter options are available?', 'Can I save filter settings?', 'How do I compare segments?'], 16),

        ('{uuid.uuid4()}', 'How do I invite team members?', 'Go to **Team Management**, click **Invite Member**, enter their email, choose a role, and send the invitation.', ARRAY['team', 'members', 'users', 'invite', 'collaborate'], 'team', ARRAY['What roles are available?', 'How do I set permissions?', 'Can I remove members?'], 17),

        ('{uuid.uuid4()}', 'What roles are available for team members?', 'Roles typically include Admin, Manager, Creator, and Viewer. Each role has specific access levels for surveys, analytics, and settings.', ARRAY['roles', 'permissions', 'access', 'levels'], 'team', ARRAY['What can each role do?', 'How do I change roles?', 'Can I create custom roles?'], 18),

        ('{uuid.uuid4()}', 'Can I control survey permissions for different users?', 'Yes — assign per-survey permissions so some users can edit while others can only view analytics.', ARRAY['permissions', 'control', 'access', 'survey'], 'team', ARRAY['How do I set survey permissions?', 'Can I share with external users?', 'What permission levels exist?'], 19),

        ('{uuid.uuid4()}', 'How do I remove a team member?', 'From the team page, select the user and choose **Remove** or revoke access. Their records are removed from your workspace permissions.', ARRAY['remove', 'delete', 'revoke', 'team'], 'team', ARRAY['Can removed members still access surveys?', 'How do I transfer ownership?', 'Can I re-invite removed members?'], 20),

        ('{uuid.uuid4()}', 'How do I reset my password?', 'On the login screen, click **Forgot Password**, enter your email, and follow the reset link sent to your inbox.', ARRAY['password', 'reset', 'forgot', 'login'], 'account', ARRAY['I didn''t receive the email', 'Can I change my email?', 'How do I change password manually?'], 21),

        ('{uuid.uuid4()}', 'What plans does Axiora Pulse offer?', 'Plans typically include a Free tier for basic surveys, Pro for advanced analytics and unlimited responses, and Enterprise for custom branding, white-label, and premium support.', ARRAY['pricing', 'plans', 'cost', 'subscription', 'billing'], 'billing', ARRAY['What''s included in each plan?', 'Can I upgrade later?', 'Do you offer refunds?'], 22),

        ('{uuid.uuid4()}', 'Can I upgrade my plan later?', 'Yes — upgrade anytime from account billing settings. Your existing surveys and data remain intact.', ARRAY['upgrade', 'change', 'plan', 'billing'], 'billing', ARRAY['How do I upgrade?', 'Is there a free trial?', 'Can I downgrade?'], 23),

        ('{uuid.uuid4()}', 'How do I contact support?', 'Use the support page or chat widget inside the app to submit a ticket, or email your account representative for faster help.', ARRAY['support', 'help', 'contact', 'ticket'], 'support', ARRAY['What''s response time?', 'Can I call support?', 'Do you have documentation?'], 24)
        ON CONFLICT (question) DO NOTHING;
        """    ]
    
    with engine.connect() as conn:
        for cmd in commands:
            try:
                print(f"Executing: {cmd}")
                conn.execute(text(cmd))
                conn.commit()
                print("Success.")
            except Exception as e:
                print(f"Error or already exists: {e}")
                conn.rollback()

if __name__ == "__main__":
    apply_updates()
