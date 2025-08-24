const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function testImprovedContent() {
    console.log('🧪 개선된 마케팅 콘텐츠 테스트');
    console.log('===========================\n');

    const agent = new CommunityMarketingAgent();

    try {
        console.log('📝 새로운 프롬프트로 콘텐츠 생성 중...\n');
        
        const content = await agent.generateRedditContent('r/productivity', 'helpful_post');
        
        console.log('🎯 생성된 콘텐츠:');
        console.log('=' .repeat(60));
        console.log(content);
        console.log('=' .repeat(60));
        
        // 체크리스트
        console.log('\n✅ 체크리스트:');
        console.log(`🔗 alllogo.net 링크 포함: ${content.includes('alllogo.net') ? '✅' : '❌'}`);
        console.log(`👤 PM 페르소나: ${content.includes('Product Manager') || content.includes('PM') || content.includes('AnnotateShot') ? '✅' : '❌'}`);
        console.log(`⭐ 기능 언급: ${content.includes('web-based') || content.includes('Chrome') ? '✅' : '❌'}`);
        console.log(`📏 적절한 길이: ${content.length > 300 && content.length < 800 ? '✅' : `❌ (${content.length} chars)`}`);
        
        console.log('\n💡 만족스럽다면 r/test에 실제 게시해보세요:');
        console.log('node test-safe-posting.js');
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    }
}

testImprovedContent();