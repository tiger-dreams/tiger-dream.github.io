require('dotenv').config();
const https = require('https');

class ThreadsContentGenerator {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    async generateThreadsContent(contentType = 'productivity_tip') {
        const prompts = {
            productivity_tip: `
            You are Tiger, Product Manager of AnnotateShot.
            
            Create a Threads post about productivity tips using screenshot annotation.
            
            THREADS-SPECIFIC REQUIREMENTS:
            - MAXIMUM 250 characters (strict limit!)
            - Include 1-2 emojis only
            - Add 2-3 hashtags at the end (short ones)
            - Personal tone as Tiger PM
            - Include "annotateshot.com" naturally
            - Engaging hook in first line
            - Be concise and punchy
            
            Specific use cases to mention:
            - Quick numbered annotations on screenshots
            - Drawing shapes to highlight specific areas
            - Adding text descriptions to image parts
            - Mobile quick editing when urgent
            - Color-coding annotations for different backgrounds
            - IT developers documenting bugs/features
            - Faster than Photoshop for quick tasks
            `,
            
            feature_showcase: `
            You are Tiger, Product Manager of AnnotateShot.
            
            Create a Threads post showcasing a specific AnnotateShot feature.
            
            REQUIREMENTS:
            - MAXIMUM 250 characters (strict limit!)
            - Start with "Just shipped:" or "New feature:"
            - Explain benefit in simple terms
            - Include call-to-action
            - 1-2 emojis only
            - 2-3 hashtags (short ones)
            - Mention annotateshot.com
            
            Features to highlight:
            - Chrome extension instant capture & edit
            - Local processing (no cloud upload needed)
            - Multi-editing mode (layering screenshots)
            - Image cropping tools
            - Emoji face covering for privacy
            - Color customization for any background
            - Shape tools for highlighting areas
            `,
            
            behind_scenes: `
            You are Tiger, Product Manager of AnnotateShot.
            
            Create a "behind the scenes" Threads post about building AnnotateShot.
            
            REQUIREMENTS:
            - MAXIMUM 250 characters (strict limit!)
            - Personal development story
            - What you learned building the product
            - Include challenges/insights
            - Relatable PM experience
            - 1-2 emojis only
            - 2-3 hashtags (short ones)
            - Subtle mention of annotateshot.com
            
            Context to draw from:
            - Building for IT developers and personal users
            - Making it faster than Photoshop for simple tasks
            - Local processing vs cloud solutions
            - Mobile-first quick editing approach
            - Solving real pain points developers face daily
            - Privacy-focused design decisions
            `,
            
            user_story: `
            You are Tiger, Product Manager of AnnotateShot.
            
            Create a Threads post sharing a user success story (fictional but realistic).
            
            REQUIREMENTS:
            - MAXIMUM 250 characters (strict limit!)
            - Start with "One of our users just told me..."
            - Specific use case from real scenarios
            - Quantify the benefit (time saved, efficiency gained)
            - 1-2 emojis only
            - 2-3 hashtags (short ones)
            - Include annotateshot.com
            
            Real use cases to draw from:
            - Developer documenting bugs with numbered annotations
            - Designer covering faces with emojis in team photos
            - Mobile user quickly editing screenshots on the go
            - IT team using multi-editing for tutorial creation
            - Someone cropping/highlighting specific UI elements
            - Privacy-conscious user processing locally vs cloud tools
            `,
            
            question_engagement: `
            You are Tiger, Product Manager of AnnotateShot.
            
            Create an engaging question post for Threads to spark discussion.
            
            REQUIREMENTS:
            - MAXIMUM 250 characters (strict limit!)
            - Ask about screenshot/productivity workflows
            - Relate to common pain points
            - Encourage responses/engagement
            - 1-2 emojis only
            - 2-3 hashtags (short ones)
            - Mention annotateshot.com as solution context
            
            Pain points to address:
            - Slow Photoshop workflow for simple annotations
            - Need for quick mobile screenshot editing
            - Privacy concerns with cloud-based tools
            - Difficulty highlighting specific areas in images
            - Time-consuming manual annotation processes
            - Color matching annotations to backgrounds
            - Managing multiple screenshot edits
            `
        };

        return await this.callGemini(prompts[contentType]);
    }

    async generateMultipleThreads(count = 5) {
        const contentTypes = [
            'productivity_tip',
            'feature_showcase', 
            'behind_scenes',
            'user_story',
            'question_engagement'
        ];

        const results = [];
        
        for (let i = 0; i < count; i++) {
            const type = contentTypes[i % contentTypes.length];
            try {
                console.log(`🧵 ${i + 1}/${count}: ${type} 생성 중...`);
                const content = await this.generateThreadsContent(type);
                results.push({
                    type: type,
                    content: content,
                    characterCount: content.length,
                    timestamp: new Date().toISOString()
                });
                
                // API 레이트 리밋 방지를 위한 딜레이
                if (i < count - 1) {
                    await this.sleep(1000);
                }
            } catch (error) {
                console.error(`❌ ${type} 생성 실패:`, error.message);
                results.push({
                    type: type,
                    content: `Error: ${error.message}`,
                    characterCount: 0,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return results;
    }

    async callGemini(prompt) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.candidates && response.candidates[0]) {
                            const generatedText = response.candidates[0].content.parts[0].text;
                            resolve(generatedText.trim());
                        } else {
                            reject(new Error('Invalid response format'));
                        }
                    } catch (error) {
                        reject(new Error('JSON 파싱 실패'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error('API 호출 실패: ' + error.message));
            });

            req.write(data);
            req.end();
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    displayResults(results) {
        console.log('\n🧵 ===== THREADS 콘텐츠 생성 결과 =====\n');
        
        results.forEach((result, index) => {
            console.log(`📱 ${index + 1}. ${result.type.toUpperCase()}`);
            console.log(`📏 글자수: ${result.characterCount}/280`);
            console.log(`⏰ 생성시간: ${new Date(result.timestamp).toLocaleString()}`);
            console.log('─'.repeat(50));
            console.log(result.content);
            console.log('─'.repeat(50));
            
            // 글자수 체크
            if (result.characterCount > 280) {
                console.log('⚠️  280자 초과! 수정 필요');
            } else if (result.characterCount > 250) {
                console.log('⚠️  250자 이상, 여유공간 부족');
            } else {
                console.log('✅ 적정 길이');
            }
            console.log('\n');
        });

        // 통계
        const successful = results.filter(r => r.characterCount > 0).length;
        const avgLength = results.reduce((sum, r) => sum + r.characterCount, 0) / results.length;
        
        console.log(`📊 통계: ${successful}/${results.length} 성공, 평균 ${Math.round(avgLength)}자`);
    }

    // 특정 콘텐츠 타입만 생성하는 헬퍼 메서드들
    async generateProductivityTip() { return await this.generateThreadsContent('productivity_tip'); }
    async generateFeatureShowcase() { return await this.generateThreadsContent('feature_showcase'); }
    async generateBehindScenes() { return await this.generateThreadsContent('behind_scenes'); }
    async generateUserStory() { return await this.generateThreadsContent('user_story'); }
    async generateQuestionPost() { return await this.generateThreadsContent('question_engagement'); }
}

module.exports = ThreadsContentGenerator;

// CLI에서 직접 실행 시
if (require.main === module) {
    async function main() {
        const generator = new ThreadsContentGenerator();
        
        // 명령행 인자 확인
        const args = process.argv.slice(2);
        const count = parseInt(args[0]) || 5;
        const type = args[1] || 'all';
        
        console.log('🚀 Threads 콘텐츠 생성기 시작!');
        console.log(`📊 ${count}개 콘텐츠 생성 예정\n`);
        
        try {
            let results;
            
            if (type === 'all') {
                results = await generator.generateMultipleThreads(count);
            } else {
                // 특정 타입만 생성
                const content = await generator.generateThreadsContent(type);
                results = [{
                    type: type,
                    content: content,
                    characterCount: content.length,
                    timestamp: new Date().toISOString()
                }];
            }
            
            generator.displayResults(results);
            
        } catch (error) {
            console.error('❌ 실행 실패:', error);
        }
    }
    
    main();
}