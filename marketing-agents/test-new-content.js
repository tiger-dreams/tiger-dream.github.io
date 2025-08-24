const CommunityMarketingAgent = require('./community-marketing-agent');

async function testNewContent() {
    console.log('🧪 Tiger 퍼소나 & annotateshot.com 링크 테스트');
    console.log('===========================================\n');
    
    const agent = new CommunityMarketingAgent();
    
    // r/productivity 테스트
    try {
        console.log('🎯 r/productivity용 콘텐츠 생성 중...');
        const content = await agent.generateRedditContent('productivity', 'helpful_post');
        
        console.log('\n📝 생성된 콘텐츠:');
        console.log('================');
        console.log(content);
        console.log('================\n');
        
        // 중요 요소들 체크
        console.log('✅ 체크리스트:');
        console.log(`- Tiger 언급: ${content.includes('Tiger') ? '✅' : '❌'}`);
        console.log(`- annotateshot.com 링크: ${content.includes('annotateshot.com') ? '✅' : '❌'}`);
        console.log(`- 마크다운 링크 형식: ${content.includes('[annotateshot.com]') ? '✅' : '❌'}`);
        console.log(`- 퍼스널 톤 (I've been): ${content.includes('I\'ve') || content.includes('I have') ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('❌ 콘텐츠 생성 실패:', error);
    }
}

testNewContent();