const snoowrap = require('snoowrap');
const readline = require('readline');
require('dotenv').config();

async function setupRedditOAuth() {
    console.log('🔐 Reddit OAuth 설정');
    console.log('==================\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        // 1. 인증 URL 생성 (snoowrap 직접 사용)
        console.log('1️⃣ OAuth 인증 URL 생성 중...');
        
        const authUrl = snoowrap.getAuthUrl({
            clientId: process.env.REDDIT_CLIENT_ID,
            scope: ['identity', 'submit', 'read'],
            redirectUri: 'http://localhost:8080',
            permanent: true,
            state: 'annotateshot-auth'
        });

        console.log('🔗 다음 URL로 이동해서 인증하세요:');
        console.log(authUrl);
        
        console.log('\n📋 다음 단계를 따라하세요:');
        console.log('1. 위 URL을 브라우저에 복사-붙여넣기');
        console.log('2. Reddit 계정으로 로그인');
        console.log('3. "Allow" 클릭하여 권한 승인');
        console.log('4. 에러 페이지가 나타나면 URL에서 "code=" 뒤의 값 복사');
        console.log('   예: localhost:8080/?state=...&code=ABC123... 에서 ABC123... 부분');
        console.log('5. 아래에 해당 코드 입력\n');

        // 2. 사용자로부터 인증 코드 입력받기
        const authCode = await new Promise(resolve => {
            rl.question('인증 코드를 입력하세요: ', resolve);
        });

        console.log('\n2️⃣ 인증 코드 처리 중...');
        
        // 3. 코드를 refresh token으로 교환
        const reddit = await snoowrap.fromAuthCode({
            code: authCode,
            userAgent: 'AnnotateShot Marketing Bot v1.0.0',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            redirectUri: 'http://localhost:8080'
        });

        const refreshToken = reddit.refreshToken;
        
        if (refreshToken) {
            console.log('\n✅ 설정 완료!');
            console.log('\n📝 다음 단계:');
            console.log('1. .env 파일을 열어서 다음 라인 추가:');
            console.log(`REDDIT_REFRESH_TOKEN=${refreshToken}`);
            console.log('\n2. 설정 후 다음 명령어로 테스트:');
            console.log('npm run test-reddit-oauth');
        } else {
            console.log('\n❌ 설정 실패. 다시 시도해주세요.');
        }

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    } finally {
        rl.close();
    }
}

// 환경변수 확인
function checkEnvironment() {
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
        console.error('❌ REDDIT_CLIENT_ID와 REDDIT_CLIENT_SECRET이 필요합니다.');
        console.error('.env 파일을 확인하세요.');
        return false;
    }
    return true;
}

if (checkEnvironment()) {
    setupRedditOAuth().catch(console.error);
}