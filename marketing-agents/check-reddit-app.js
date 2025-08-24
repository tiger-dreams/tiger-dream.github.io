require('dotenv').config();

console.log('🔍 Reddit 앱 설정 확인');
console.log('=====================\n');

console.log('현재 환경변수:');
console.log(`REDDIT_CLIENT_ID: ${process.env.REDDIT_CLIENT_ID}`);
console.log(`REDDIT_CLIENT_SECRET: ${process.env.REDDIT_CLIENT_SECRET ? '설정됨' : '없음'}`);

console.log('\n🔧 Reddit 앱 설정을 확인하세요:');
console.log('1. https://www.reddit.com/prefs/apps 방문');
console.log('2. AnnotateShot Marketing Bot 앱 클릭');
console.log('3. "redirect uri" 확인');
console.log('4. 설정된 redirect URI를 알려주세요');

console.log('\n💡 일반적인 redirect URI 옵션:');
console.log('- http://localhost:8080');
console.log('- http://127.0.0.1:8080'); 
console.log('- https://www.reddit.com/');
console.log('- http://www.example.com');

console.log('\n📋 또는 새로운 redirect URI를 설정할 수 있습니다:');
console.log('1. Reddit 앱 설정에서 "edit" 클릭');
console.log('2. redirect uri를 "http://localhost:8080"으로 변경');
console.log('3. 저장 후 다시 시도');