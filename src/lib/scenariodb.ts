interface Scenario {
  Title: string;
  "Scenario ID": string;
  "Scenario Narrative": string;
  "AI Rating Prompt": string;
}

interface ProgramScenarios {
  [scenarioName: string]: Scenario;
}

interface Scenarios {
  [programName: string]: ProgramScenarios;
}

const scenarios: Scenarios = {
    "Sample Scenarios": {
        "Scenario 1": {
            "Title": "Domain Change and Offer Website Backup",
            "Scenario ID": "Hk5fKEM42MMB04hDUyuq",
            "Scenario Narrative": "The customer needs assistance changing their domain and has not considered implementing website backups for protection. The guide also introduces the concept of website security during the conversation.",
            "AI Rating Prompt": `You are an AI Quality Analyst working in a BPO setting, specialized in auditing customer service conversations.
                                Your task is to analyze the following transcript and provide a detailed audit report.

                                For each success indicator listed below, assign a rating from **1 to 5 stars** (where 5 is the highest/best performance) and provide a **brief explanation** for your rating.

                                **Success Indicators:**
                                -   **Ask the right questions:** Did the representative ask clarifying, open-ended, or probing questions to understand the customer's situation thoroughly?
                                -   **Initiate sales discovery:** Did the representative identify potential upselling or cross-selling opportunities, or explore additional customer needs that could lead to a sale?
                                -   **Actively listen:** Did the representative show signs of understanding, allow the customer to speak without interruption, and respond appropriately to unspoken cues?
                                -   **Identify the customer's issue:** Was the representative able to quickly and accurately pinpoint the core problem or request the customer had?
                                -   **Provide acknowledgment, empathy, and reassurance:** Did the representative validate the customer's feelings, show understanding, and assure them that their issue would be handled?
                                -   **Educate the customer:** Did the representative clearly explain solutions, product features, or next steps in an understandable way?

                                **Format your response as a JSON object** with the following structure:
                                {
                                "summary": "A concise summary of the conversation.",
                                "ratings": {
                                    "ask_right_questions": { "stars": N, "explanation": "..." },
                                    "initiate_sales_discovery": { "stars": N, "explanation": "..." },
                                    "actively_listen": { "stars": N, "explanation": "..." },
                                    "identify_customer_issue": { "stars": N, "explanation": "..." },
                                    "provide_acknowledgment_empathy_reassurance": { "stars": N, "explanation": "..." },
                                    "educate_customer": { "stars": N, "explanation": "..." }
                                },
                                "overall_sentiment": "e.g., Positive, Neutral, Negative, Escalating",
                                "areas_for_improvement": ["Suggestion 1", "Suggestion 2"]
                                }

                                Conversation Transcript:
                                `,
        },
        "Scenario 2": {
            "Title": "Coaching on Tardiness",
            "Scenario ID": "agent_01jvym8ndxe7rtmms63ehpqhc5",
            "Scenario Narrative": "Elsa Smith, a Sutherland employee who is about to be regularized, needs to be coached on her tardiness. She came in late twice last week. Prior to this, she had 3 more instances of tardiness in the previous month.",
            "AI Rating Prompt": `You are an AI Quality Analyst specialized in evaluating management coaching effectiveness. Your task is to analyze the coaching session transcript and provide a detailed audit report.

For each success indicator listed below, assign a rating from **1 to 5 stars** (where 5 is the highest/best performance) and provide a **brief explanation** for your rating, justifying your score based on specific examples from the conversation transcript. If the manager failed to do it, the rating should be 1-2 stars. If the manager did well, the rating should be 4-5 stars.

**Success Indicators:**
-   **Establish Rapport:** Did the manager create a comfortable and trusting environment for Elsa to openly discuss her tardiness?
-   **Clarify Performance Gap:** Did the manager clearly and respectfully explain the impact of Elsa's tardiness on the team and the company?
-   **Explore Root Causes:** Did the manager effectively explore the reasons behind Elsa's tardiness, going beyond surface-level explanations?
-   **Active Listening and Empathy:** Did the manager actively listen to Elsa's perspective, show empathy for her challenges, and validate her feelings?
-   **Collaborative Goal Setting:** Did the manager work with Elsa to set specific, measurable, achievable, relevant, and time-bound (SMART) goals for improving her punctuality?
-   **Action Planning and Support:** Did the manager and Elsa develop a concrete action plan with specific steps and resources to help Elsa be on time? Did the manager offer support and resources?
-   **Empowerment and Ownership:** Did the manager empower Elsa to take ownership of her punctuality and develop her own solutions?
-   **Follow-Up and Accountability:** Did the manager establish a clear plan for follow-up and accountability to ensure Elsa stays on track with her goals?

**Format your response as a JSON object** with the following structure:
{
"summary": "A concise summary of the coaching session with Elsa Smith regarding her recent tardiness.",
"ratings": {
    "establish_rapport": { "stars": N, "explanation": "..." },
    "clarify_performance_gap": { "stars": N, "explanation": "..." },
    "explore_root_causes": { "stars": N, "explanation": "..." },
    "active_listening_and_empathy": { "stars": N, "explanation": "..." },
    "collaborative_goal_setting": { "stars": N, "explanation": "..." },
    "action_planning_and_support": { "stars": N, "explanation": "..." },
    "empowerment_and_ownership": { "stars": N, "explanation": "..." },
    "follow_up_and_accountability": { "stars": N, "explanation": "..." }
},
"overall_sentiment": "e.g., Constructive, Neutral, Avoidant, Confrontational",
"areas_for_improvement": ["Suggestion 1", "Suggestion 2"]
}

Conversation Transcript:`
        }
    }
}

export default scenarios;