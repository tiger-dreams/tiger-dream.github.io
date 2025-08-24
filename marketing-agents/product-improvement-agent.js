class ProductImprovementAgent {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.currentFeatures = [
            'Screenshot annotation',
            'Shape tools (rectangle, circle, arrow)',
            'Text and emoji additions',
            'Multiple export formats',
            'Chrome extension',
            'Drag and drop',
            'Undo/redo functionality',
            'Multi-language support'
        ];
    }

    async analyzeUserFeedback(feedbackData) {
        const prompt = `
        Analyze user feedback for AnnotateShot and provide improvement recommendations:
        
        Current MAU: 135, Target: 1000 by end of year
        
        Feedback categories to analyze:
        1. Feature requests
        2. Usability issues
        3. Performance complaints
        4. Missing functionality
        5. Positive feedback patterns
        
        Sample feedback: ${JSON.stringify(feedbackData)}
        
        Provide:
        - Priority ranking of issues (High/Medium/Low)
        - Implementation difficulty (Easy/Medium/Hard)
        - Potential MAU impact
        - Quick wins vs long-term projects
        - Specific development recommendations
        `;

        return await this.callGemini(prompt);
    }

    async generateFeatureIdeas() {
        const prompt = `
        Generate innovative feature ideas for AnnotateShot to drive user growth:
        
        Current features: ${this.currentFeatures.join(', ')}
        
        Focus areas:
        1. Viral/sharing features
        2. Productivity enhancements
        3. Team collaboration
        4. Mobile experience
        5. Integration opportunities
        
        For each idea provide:
        - Feature description
        - Target user benefit
        - Growth potential (1-10)
        - Development effort (1-10)
        - Implementation timeline
        - Success metrics
        
        Prioritize features that could drive word-of-mouth growth.
        `;

        return await this.callGemini(prompt);
    }

    async optimizeOnboarding() {
        const prompt = `
        Design an improved onboarding flow for AnnotateShot:
        
        Current situation:
        - Users land on main page with tool ready
        - No guided tutorial
        - Feature discovery happens organically
        
        Goals:
        - Reduce time to first value
        - Increase feature adoption
        - Improve retention rate
        
        Create:
        1. Step-by-step onboarding sequence
        2. Interactive tutorial elements
        3. Progress indicators
        4. Skip options for experienced users
        5. Success celebration moments
        6. Clear next steps after first annotation
        
        Focus on getting users to create their first annotation within 60 seconds.
        `;

        return await this.callGemini(prompt);
    }

    async analyzeCompetitorFeatures() {
        const prompt = `
        Analyze competitor features for screenshot annotation tools:
        
        Research areas:
        - Lightshot, Greenshot, Snagit, CloudApp
        - What features do they have that AnnotateShot lacks?
        - What does AnnotateShot do better?
        - Market gaps and opportunities
        
        Provide:
        1. Feature gap analysis
        2. Competitive advantages to emphasize
        3. "Me too" features we need
        4. Unique positioning opportunities
        5. Pricing strategy insights
        
        Focus on features that could differentiate AnnotateShot in the market.
        `;

        return await this.callGemini(prompt);
    }

    async generateABTestIdeas() {
        const prompt = `
        Generate A/B test ideas for AnnotateShot to improve conversion:
        
        Test categories:
        1. Landing page optimization
        2. Tool interface improvements
        3. Call-to-action variations
        4. Feature discovery
        5. Export/sharing flows
        
        For each test provide:
        - Hypothesis
        - Test setup (A vs B)
        - Success metrics
        - Expected impact
        - Test duration needed
        - Statistical significance requirements
        
        Prioritize tests that could impact MAU growth directly.
        `;

        return await this.callGemini(prompt);
    }

    async identifyUserSegments() {
        const prompt = `
        Identify and analyze user segments for AnnotateShot:
        
        Potential segments:
        - Content creators
        - Remote workers
        - Educators/trainers
        - Developers (bug reporting)
        - Customer support teams
        - Students
        - Designers
        
        For each segment provide:
        1. Primary use cases
        2. Pain points we solve
        3. Feature priorities
        4. Marketing messages that resonate
        5. Acquisition channels
        6. Retention strategies
        7. Monetization potential
        
        Recommend which segments to focus on for fastest MAU growth.
        `;

        return await this.callGemini(prompt);
    }

    async generateRetentionStrategies() {
        const prompt = `
        Create user retention strategies for AnnotateShot:
        
        Current challenges:
        - One-time use pattern for many users
        - Need to create habit formation
        - Competition from desktop tools
        
        Strategy areas:
        1. Email re-engagement campaigns
        2. Feature discovery nudges
        3. Usage milestone celebrations
        4. Community building
        5. Regular use case reminders
        6. Progressive feature unlocking
        
        Focus on converting one-time users to regular weekly users.
        `;

        return await this.callGemini(prompt);
    }

    async calculateFeatureROI(featureDescription) {
        const prompt = `
        Calculate ROI for proposed feature: "${featureDescription}"
        
        Consider:
        - Development time/cost
        - Expected user adoption rate
        - Impact on MAU growth
        - Maintenance overhead
        - Competitive advantage gained
        
        Current context:
        - MAU: 135 → target 1000
        - Timeline: 4 months
        - Limited development resources
        
        Provide:
        1. Implementation effort estimate
        2. Expected MAU impact
        3. Risk assessment
        4. ROI calculation
        5. Go/no-go recommendation
        `;

        return await this.callGemini(prompt);
    }

    async callGemini(prompt) {
        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 2500,
                        temperature: 0.7
                    }
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            return null;
        }
    }

    async runProductAnalysis() {
        const tasks = [
            this.generateFeatureIdeas(),
            this.optimizeOnboarding(),
            this.identifyUserSegments(),
            this.generateABTestIdeas()
        ];

        const results = await Promise.all(tasks);
        
        return {
            featureIdeas: results[0],
            onboardingOptimization: results[1],
            userSegments: results[2],
            abTestIdeas: results[3],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ProductImprovementAgent;