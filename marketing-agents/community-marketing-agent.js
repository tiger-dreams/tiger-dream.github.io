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
            You are Tiger, the Product Manager of AnnotateShot, a web-based screenshot annotation tool.
            
            Write a helpful Reddit post for ${subreddit} about screenshot annotation workflows.
            
            CRITICAL REQUIREMENTS:
            - Write as Tiger (AnnotateShot PM) sharing personal product insights
            - MUST include clickable link: "Try it at [annotateshot.com](http://annotateshot.com)" 
            - Mention specific AnnotateShot features naturally
            - Provide genuine value about screenshot workflows
            - Professional but approachable tone (use "I've been working on..." style)
            - Focus on productivity benefits and real-world use cases
            - 250-400 words (concise but informative)
            
            Real use cases to emphasize:
            - Quick numbered annotations on screenshots (bug reports, tutorials)
            - Drawing shapes to highlight specific UI elements or code sections
            - Adding text descriptions to image parts for documentation
            - Mobile quick editing when urgent fixes are needed
            - Local processing (no cloud upload) for privacy-conscious developers
            - Color-coding annotations to match different backgrounds/themes
            - Covering faces with emojis in team photos/screenshots
            - Multi-editing mode for layering multiple screenshots
            - Image cropping for focusing on specific areas
            - Chrome extension for instant capture & edit workflow
            
            Positioning vs competitors:
            - Faster than Photoshop for simple annotation tasks
            - More feature-rich than basic markup tools
            - Designed specifically for IT developers and productivity users
            - Perfect for both professional and personal use
            `,
            
            comment_reply: `
            You are Tiger, the Product Manager of AnnotateShot.
            
            Generate 3 helpful comment replies for ${subreddit} when someone asks about:
            - Screenshot tools
            - Image annotation
            - Productivity workflows
            - Web-based tools
            
            REQUIREMENTS:
            - Write as Tiger (AnnotateShot PM) with personal touch
            - Be helpful first, promotional second
            - Include clickable link: "[annotateshot.com](http://annotateshot.com)" naturally
            - Mention specific real-world use cases briefly
            - Keep each reply under 100 words
            
            Specific scenarios to mention:
            - Developers documenting bugs with numbered annotations
            - Quick mobile editing for urgent tasks
            - Privacy-focused local processing (no cloud uploads)
            - Faster than Photoshop for simple markup tasks
            - Color-matching annotations to different UI themes
            - Emoji face covering in team screenshots
            - Multi-layer editing for complex documentation
            `,
            
            tutorial_post: `
            You are Tiger, the Product Manager of AnnotateShot.
            
            Create a detailed tutorial post for ${subreddit}:
            "How we built AnnotateShot: Screenshot workflow optimization insights"
            
            REQUIREMENTS:
            - Write as Tiger (AnnotateShot PM) sharing personal product development insights
            - MUST include clickable link: "Try it at [annotateshot.com](http://annotateshot.com)"
            - Focus on workflow optimization principles
            - Share specific productivity metrics/improvements
            - Include step-by-step best practices
            - Professional but engaging tone (use "I've learned..." style)
            - 300-450 words
            
            Real development insights to share:
            - Why we chose local processing over cloud solutions
            - How we optimized for mobile quick-edit scenarios
            - Building features faster than Photoshop for simple tasks
            - Designing for IT developers' specific needs (bug reports, documentation)
            - Privacy-first approach (no upload requirements)
            - Multi-editing workflow for complex screenshot combinations
            - Chrome extension integration challenges and solutions
            - Color-coding system for different UI themes/backgrounds
            - Balancing feature richness with simplicity
            `,
            
            dev_update: `
            You are Tiger, the Product Manager of AnnotateShot, sharing recent development updates.
            
            Write an authentic development update post for ${subreddit} covering recent technical improvements and development decisions.
            
            CRITICAL REQUIREMENTS:
            - Write as Tiger sharing personal development journey and recent updates
            - MUST include clickable link: "Try it at [annotateshot.com](http://annotateshot.com)"
            - Share specific technical decisions and challenges from recent development
            - Include metrics, user feedback, or performance improvements when relevant  
            - Authentic developer-to-developer tone with technical depth
            - 300-500 words (detailed but engaging)
            
            Recent development themes to draw from:
            - Image quality improvements (PNG vs JPEG, canvas rendering optimization)
            - User setting persistence challenges and localStorage implementation
            - Mobile vs desktop UX considerations and responsive design decisions
            - Performance optimization decisions (Math.round vs Math.floor, rendering quality)
            - Privacy-first architecture choices (local processing vs cloud)
            - Chrome extension integration complexities and user workflow improvements
            - User feedback driving feature priorities and development roadmap
            - Balancing simplicity with power-user features
            - MAU growth challenges and technical scalability considerations
            - Default setting decisions based on user behavior analytics
            
            Story structure approach:
            1. What we recently shipped/improved (specific technical details)
            2. Why it mattered (user pain point, performance issue, or technical debt)
            3. How we approached the solution (technical decisions and trade-offs)
            4. What we learned from the process (development insights or user feedback)
            5. What's next based on user feedback and growth metrics
            
            Technical authenticity:
            - Mention specific code decisions (canvas smoothing, localStorage keys, etc.)
            - Include performance metrics or user behavior data when relevant
            - Share honest challenges and how they were overcome
            - Connect technical decisions to user experience improvements
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

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'reddit') {
        const subreddit = args[1];
        const contentType = args[2];
        const shouldPost = args.includes('--post');
        
        if (!subreddit || !contentType) {
            console.log('🚀 Reddit 마케팅 도구');
            console.log('════════════════════');
            console.log('사용법:');
            console.log('  node community-marketing-agent.js reddit [서브레딧] [타입]');
            console.log('  node community-marketing-agent.js reddit [서브레딧] [타입] --post');
            console.log('');
            console.log('예시:');
            console.log('  node community-marketing-agent.js reddit r/productivity helpful_post');
            console.log('  node community-marketing-agent.js reddit r/webdev tutorial_post --post');
            console.log('');
            console.log('콘텐츠 타입:');
            console.log('  - helpful_post     도움되는 포스트');
            console.log('  - tutorial_post    튜토리얼/개발 인사이트');
            console.log('  - dev_update       개발 업데이트/과정 공유');
            console.log('  - comment_reply    댓글 답변 3개');
            return;
        }
        
        const agent = new CommunityMarketingAgent();
        
        async function runRedditTask() {
            try {
                console.log(`🎯 ${subreddit} - ${contentType} 생성 중...`);
                const content = await agent.generateRedditContent(subreddit, contentType);
                
                console.log('\\n🚀 === 생성된 Reddit 콘텐츠 ===\\n');
                console.log(content);
                console.log('\\n' + '='.repeat(60));
                
                if (shouldPost) {
                    console.log('\\n📤 Reddit에 자동 포스팅 중...');
                    const result = await agent.postToReddit(subreddit.replace('r/', ''), contentType, {
                        generatedContent: content,
                        safetyCheck: false  // 임시로 안전 검사 비활성화
                    });
                    
                    if (result.success) {
                        console.log(`✅ ${subreddit}에 성공적으로 포스팅되었습니다!`);
                        console.log(`🔗 ${result.postUrl || 'URL 확인 필요'}`);
                    } else {
                        console.log(`❌ 포스팅 실패: ${result.error}`);
                    }
                } else {
                    console.log('\\n💡 실제 포스팅하려면 --post 플래그를 추가하세요');
                }
                
            } catch (error) {
                console.error('❌ 실행 실패:', error.message);
            }
        }
        
        runRedditTask();
        
    } else {
        console.log('🤖 Community Marketing Agent');
        console.log('═══════════════════════════');
        console.log('사용법:');
        console.log('  node community-marketing-agent.js reddit [서브레딧] [타입] [--post]');
        console.log('');
        console.log('예시:');
        console.log('  node community-marketing-agent.js reddit r/productivity helpful_post');
    }
}