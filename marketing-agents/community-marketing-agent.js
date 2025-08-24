const RedditOAuthClient = require('./reddit-oauth-client');

class CommunityMarketingAgent {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.redditClient = new RedditOAuthClient();
        this.targetCommunities = {
            reddit: [
                'r/productivity',
                'r/webdev',
                'r/WorkflowOptimization',
                'r/Chrome',
                'r/techsupport',
                'r/webtools',
                'r/entrepreneur'
            ],
            discord: [
                'Web Development servers',
                'Productivity communities',
                'Content Creator groups',
                'Designer communities'
            ]
        };
    }

    async generateRedditContent(subreddit, contentType) {
        const contentPrompts = {
            helpful_post: `
            You are the Product Manager of AnnotateShot (alllogo.net), a web-based screenshot annotation tool.
            
            Write a helpful Reddit post for ${subreddit} about screenshot annotation workflows.
            
            CRITICAL REQUIREMENTS:
            - Write as AnnotateShot PM sharing product insights
            - MUST include "Try it at alllogo.net" or "Check it out at alllogo.net" 
            - Mention specific AnnotateShot features naturally
            - Provide genuine value about screenshot workflows
            - Professional but approachable tone
            - Focus on productivity benefits
            - 250-400 words (concise but informative)
            
            AnnotateShot features to highlight:
            - Web-based (no download needed)
            - Real-time collaboration
            - Multiple export formats
            - Shape tools, text, arrows
            - Chrome extension available
            - Free to use
            `,
            
            comment_reply: `
            You are the Product Manager of AnnotateShot (alllogo.net).
            
            Generate 3 helpful comment replies for ${subreddit} when someone asks about:
            - Screenshot tools
            - Image annotation
            - Productivity workflows
            - Web-based tools
            
            REQUIREMENTS:
            - Write as AnnotateShot PM
            - Be helpful first, promotional second
            - Include "alllogo.net" link naturally
            - Mention specific features briefly
            - Keep each reply under 100 words
            `,
            
            tutorial_post: `
            You are the Product Manager of AnnotateShot (alllogo.net).
            
            Create a detailed tutorial post for ${subreddit}:
            "How we built AnnotateShot: Screenshot workflow optimization insights"
            
            REQUIREMENTS:
            - Write as AnnotateShot PM sharing product development insights
            - MUST include "Try it at alllogo.net"
            - Focus on workflow optimization principles
            - Share specific productivity metrics/improvements
            - Include step-by-step best practices
            - Professional but engaging tone
            - 300-450 words
            `
        };

        return await this.callGemini(contentPrompts[contentType]);
    }

    async generateDiscordEngagement() {
        const prompt = `
        Create Discord community engagement strategies for AnnotateShot:
        
        1. Server introduction messages (5 variations)
        2. Helpful responses to common questions about screenshot tools
        3. Tutorial sharing approaches
        4. Community event ideas
        5. Collaboration proposals with server admins
        
        Focus on building relationships first, promotion second.
        `;

        return await this.callGemini(prompt);
    }

    async findInfluencerOutreach() {
        const prompt = `
        Create outreach templates for productivity/tech influencers:
        
        Target profiles:
        - Productivity YouTubers (10k-100k subs)
        - Tech Twitter accounts (5k+ followers)
        - LinkedIn productivity coaches
        - Medium writers in tech/productivity
        
        Create 3 email templates:
        1. Cold outreach for tool review
        2. Partnership proposal
        3. Feature collaboration offer
        
        Include value propositions and customization points.
        `;

        return await this.callGemini(prompt);
    }

    async analyzeTrendingTopics() {
        const prompt = `
        Analyze current trends relevant to AnnotateShot marketing:
        
        Topics to monitor:
        - Remote work tools
        - Productivity hacks
        - Chrome extensions
        - Screenshot workflows
        - Content creation tools
        
        Suggest:
        1. Trending hashtags to use
        2. Popular discussion topics to join
        3. Content angles to pursue
        4. Community events to participate in
        5. Seasonal opportunities (Q4 2024)
        `;

        return await this.callGemini(prompt);
    }

    async createCommunityCalendar() {
        const prompt = `
        Create a 4-month community marketing calendar (Sep-Dec 2024):
        
        Weekly activities:
        - Reddit post schedule (which subs, what topics)
        - Discord engagement goals
        - Comment reply targets
        - Influencer outreach batch
        
        Monthly themes:
        - September: Back-to-school productivity
        - October: Remote work optimization  
        - November: Year-end project management
        - December: 2025 planning tools
        
        Include specific dates, platforms, and content types.
        `;

        return await this.callGemini(prompt);
    }

    async generateUserStories() {
        const prompt = `
        Create 10 realistic user success stories for AnnotateShot:
        
        User types:
        - Remote worker explaining processes
        - Teacher creating tutorials
        - Developer documenting bugs
        - Content creator making guides
        - Student organizing research
        
        Each story should include:
        - User background
        - Problem they solved
        - How they use AnnotateShot
        - Specific results/benefits
        - Quote-ready testimonials
        
        Make them authentic and relatable.
        `;

        return await this.callGemini(prompt);
    }

    async monitorMentions() {
        // This would integrate with Reddit API, Discord bots, etc.
        const searchTerms = [
            'screenshot annotation',
            'image annotation tool',
            'screenshot editor',
            'web annotation',
            'alllogo.net',
            'AnnotateShot'
        ];

        return {
            searchTerms,
            platforms: this.targetCommunities,
            monitoringFrequency: 'every 4 hours',
            responseGuidelines: await this.callClaude(`
                Create response guidelines for when AnnotateShot is mentioned online:
                1. When to respond vs when to stay silent
                2. How to handle negative feedback
                3. How to amplify positive mentions
                4. Template responses for common scenarios
            `)
        };
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

    async postToReddit(subreddit, contentType = 'helpful_post', options = {}) {
        try {
            console.log(`🚀 r/${subreddit}에 자동 게시 시작...`);
            
            // 1. 콘텐츠 생성
            const content = await this.generateRedditContent(subreddit, contentType);
            if (!content) {
                throw new Error('콘텐츠 생성 실패');
            }

            // 2. 제목과 본문 분리
            const lines = content.split('\n');
            const titleMatch = lines.find(line => line.includes('**Title:**') || line.includes('**제목:**'));
            let title = titleMatch ? titleMatch.replace(/\*\*Title:\*\*|\*\*제목:\*\*/g, '').trim() : 
                       lines[0].replace(/^#+\s*/, '').trim();
            
            // 제목에서 마크다운 제거
            title = title.replace(/\*\*/g, '');
            
            // 본문에서 제목 라인 제거
            const bodyLines = lines.filter(line => 
                !line.includes('**Title:**') && 
                !line.includes('**제목:**') &&
                line !== lines[0]
            );
            const text = bodyLines.join('\n').trim();

            // 3. 안전 검사
            if (options.safetyCheck !== false) {
                const canPost = await this.redditClient.canPostToSubreddit(subreddit.replace('r/', ''));
                if (!canPost) {
                    console.warn('⚠️ 안전 검사 실패: 게시를 건너뜁니다.');
                    return { success: false, reason: 'safety_check_failed' };
                }
            }

            // 4. 실제 게시
            const result = await this.redditClient.submitPost(
                subreddit.replace('r/', ''), // 'r/' 제거
                title,
                text,
                options
            );

            return result;

        } catch (error) {
            console.error(`❌ r/${subreddit} 자동 게시 실패:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async runAutomatedPosting() {
        console.log('🤖 자동 Reddit 게시 시작...');
        
        const targetSubs = ['productivity', 'webdev']; // 'r/' 제거
        const results = [];

        for (const sub of targetSubs) {
            const result = await this.postToReddit(sub, 'helpful_post', {
                safetyCheck: true,
                resubmit: false // 중복 게시 방지
            });
            results.push({ subreddit: sub, ...result });
            
            // 서브레딧 간 30분 대기 (테스트시에는 5초로 단축)
            if (sub !== targetSubs[targetSubs.length - 1]) {
                console.log('⏳ 5초 대기 중...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        return results;
    }

    async runWeeklyCommunityTasks() {
        const tasks = [
            this.generateRedditContent('r/productivity', 'helpful_post'),
            this.generateRedditContent('r/webdev', 'comment_reply'),
            this.generateDiscordEngagement(),
            this.analyzeTrendingTopics()
        ];

        const results = await Promise.all(tasks);
        
        return {
            redditPost: results[0],
            redditComments: results[1],
            discordStrategy: results[2],
            trendingTopics: results[3],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = CommunityMarketingAgent;