const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function testSafePosting() {
    console.log('🧪 안전한 테스트 게시 시도');
    console.log('=======================\n');

    const agent = new CommunityMarketingAgent();

    // 테스트용 서브레딧들 (권한 요구사항이 낮음)
    const testSubreddits = [
        'test',
        'testingground4bots',
        'FreeKarma4U',
        'u_Visual_Diet1286' // 본인 프로필에 게시 가능
    ];

    console.log('📋 테스트 서브레딧 목록:');
    testSubreddits.forEach((sub, i) => {
        console.log(`${i + 1}. r/${sub}`);
    });

    console.log('\n🔍 각 서브레딧에 게시 권한 확인 중...\n');

    for (const subreddit of testSubreddits) {
        try {
            console.log(`📝 r/${subreddit} 테스트 중...`);
            
            const result = await agent.postToReddit(subreddit, 'helpful_post', {
                safetyCheck: false // 안전 검사 비활성화
            });

            if (result.success) {
                console.log(`✅ r/${subreddit} 성공!`);
                console.log(`🔗 URL: ${result.url}\n`);
                break; // 첫 성공시 중단
            } else {
                console.log(`❌ r/${subreddit} 실패: ${result.error}\n`);
            }
            
            // 요청 간격
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ r/${subreddit} 오류: ${error.message}\n`);
        }
    }
}

testSafePosting();