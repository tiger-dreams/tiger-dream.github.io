class ContentMarketingAgent {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.currentMAU = 135;
        this.targetMAU = 1000;
    }

    async generateSEOBlogPost(topic) {
        const prompt = `
        Create an SEO-optimized blog post about "${topic}" for AnnotateShot (alllogo.net), a web-based screenshot annotation tool.
        
        Target keywords: screenshot annotation, image editing, web tool, productivity
        Current MAU: ${this.currentMAU}, Target: ${this.targetMAU}
        
        Include:
        - Catchy title with primary keyword
        - Meta description (150-160 chars)
        - H1, H2, H3 structure
        - Internal links to AnnotateShot features
        - Call-to-action
        - 800-1200 words
        
        Make it helpful and not overly promotional.
        `;

        return await this.callGemini(prompt);
    }

    async generateSocialMediaContent(platform, contentType = 'tip') {
        const prompts = {
            twitter: `Create 5 Twitter posts about AnnotateShot screenshot annotation tips. Each under 280 chars. Include relevant hashtags.`,
            
            reddit: `Write a helpful Reddit comment/post for r/productivity or r/webdev about screenshot annotation workflows. Natural tone, not promotional.`,
            
            youtube: `Create YouTube video script (5-7 minutes) showing "5 Hidden Features in AnnotateShot". Include timestamps and engaging hooks.`,
            
            instagram: `Create Instagram carousel post content (5 slides) about "Screenshot Annotation Hacks for Content Creators". Include captions.`
        };

        return await this.callGemini(prompts[platform] || prompts.twitter);
    }

    async generateTutorialContent() {
        const prompt = `
        Create a comprehensive tutorial outline for AnnotateShot covering:
        1. Basic annotation features
        2. Advanced shape tools
        3. Text and emoji annotations
        4. Productivity shortcuts
        5. Export options
        
        Format as step-by-step guide with screenshots placeholders [SCREENSHOT: description]
        Target audience: content creators, educators, remote workers
        `;

        return await this.callGemini(prompt);
    }

    async createEmailCampaign(campaignType) {
        const campaigns = {
            welcome: 'Create welcome email series (3 emails) for new AnnotateShot users. Include onboarding tips.',
            feature: 'Create feature announcement email about new AnnotateShot capabilities.',
            retention: 'Create re-engagement email for inactive users with productivity tips.'
        };

        return await this.callClaude(campaigns[campaignType]);
    }

    async optimizeWebsiteContent() {
        const prompt = `
        Analyze AnnotateShot website (alllogo.net) and suggest SEO improvements:
        
        Current features:
        - Screenshot annotation
        - Shape tools (rectangle, circle, arrow)
        - Text and emoji additions
        - Multiple export formats
        - Chrome extension
        
        Provide:
        1. Title tag optimization
        2. Meta description suggestions
        3. Header structure improvements
        4. Content gaps to fill
        5. Internal linking strategy
        6. Landing page variations for different user segments
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
                        maxOutputTokens: 2000,
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

    async runDailyContentGeneration() {
        const tasks = [
            this.generateSocialMediaContent('twitter'),
            this.generateSocialMediaContent('reddit'),
            this.generateSEOBlogPost('screenshot annotation productivity tips')
        ];

        const results = await Promise.all(tasks);
        
        return {
            twitter: results[0],
            reddit: results[1],
            blogPost: results[2],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ContentMarketingAgent;