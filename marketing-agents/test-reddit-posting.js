const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function testRedditPosting() {
    console.log('🧪 Reddit 자동 게시 테스트');
    console.log('========================\n');

    const communityAgent = new CommunityMarketingAgent();

    try {
        // 1. Reddit API 연결 테스트
        console.log('🔗 Reddit API 연결 테스트...');
        const connectionTest = await communityAgent.redditClient.testConnection();
        
        if (!connectionTest) {
            console.error('❌ Reddit API 연결 실패. 환경변수를 확인하세요:');
            console.error('- REDDIT_CLIENT_ID');
            console.error('- REDDIT_CLIENT_SECRET'); 
            console.error('- REDDIT_USERNAME');
            console.error('- REDDIT_PASSWORD');
            return;
        }

        // 2. 사용자 정보 확인
        console.log('\n📊 계정 정보 확인...');
        await communityAgent.redditClient.checkUserKarma();

        // 3. 테스트 서브레딧에 게시 (실제로는 테스트용 서브레딧 사용 권장)
        console.log('\n🚀 테스트 게시 시작...');
        console.log('⚠️  주의: 실제 서브레딧에 게시됩니다!');
        console.log('⚠️  테스트용이므로 잠시 후 삭제하는 것을 권장합니다.');
        
        // 실제 게시 전 확인
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            readline.question('\nr/test에 실제로 게시하시겠습니까? (y/N): ', resolve);
        });
        readline.close();

        if (answer.toLowerCase() !== 'y') {
            console.log('❌ 사용자가 취소했습니다.');
            return;
        }

        // 4. 실제 게시 테스트
        const result = await communityAgent.postToReddit('test', 'helpful_post', {
            safetyCheck: false // 테스트용이므로 안전 검사 비활성화
        });

        console.log('\n📋 게시 결과:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log(`\n✅ 게시 성공!`);
            console.log(`🔗 게시물 URL: ${result.url}`);
            console.log(`📝 게시물 ID: ${result.id}`);
        } else {
            console.log('\n❌ 게시 실패:');
            console.log(`오류: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error.message);
        console.error('전체 스택:', error.stack);
    }
}

// 환경변수 체크
function checkEnvironmentVariables() {
    const required = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_REFRESH_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ 필수 환경변수가 누락되었습니다:');
        missing.forEach(key => console.error(`- ${key}`));
        console.error('\n.env 파일을 확인하고 OAuth 설정을 완료하세요:');
        console.error('npm run setup-reddit');
        return false;
    }
    return true;
}

// 실행
if (checkEnvironmentVariables()) {
    testRedditPosting().catch(console.error);
} else {
    console.log('\n💡 OAuth 설정 방법:');
    console.log('1. npm run setup-reddit');
    console.log('2. 브라우저에서 Reddit 인증');
    console.log('3. 다시 실행');
}