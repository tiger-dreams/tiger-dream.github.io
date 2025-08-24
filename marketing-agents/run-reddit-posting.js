const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function runRedditPosting() {
    console.log('🤖 AnnotateShot 자동 Reddit 마케팅 시작!');
    console.log('=====================================\n');

    const agent = new CommunityMarketingAgent();

    try {
        console.log('📋 대상 서브레딧: r/productivity, r/webdev');
        console.log('⏰ 각 게시물 간 5초 간격으로 진행\n');
        
        const results = await agent.runAutomatedPosting();
        
        console.log('\n📊 게시 결과:');
        results.forEach((result, index) => {
            console.log(`\n${index + 1}. r/${result.subreddit}:`);
            if (result.success) {
                console.log(`   ✅ 성공!`);
                console.log(`   🔗 URL: ${result.url}`);
                console.log(`   📝 ID: ${result.id}`);
                console.log(`   ⭐ alllogo.net 링크 포함 확인!`);
            } else {
                console.log(`   ❌ 실패: ${result.error || result.reason}`);
            }
        });

        const successful = results.filter(r => r.success).length;
        console.log(`\n🎉 총 ${successful}/${results.length}개 게시물이 성공적으로 게시되었습니다!`);
        
        if (successful > 0) {
            console.log('\n💡 팁: 게시물 성과를 모니터링하고 커뮤니티 참여를 관리하세요.');
        }

    } catch (error) {
        console.error('❌ 자동 게시 중 오류 발생:', error.message);
        console.error('전체 오류:', error);
    }
}

runRedditPosting();