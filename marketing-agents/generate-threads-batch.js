const ThreadsContentGenerator = require('./threads-content-generator');
const GoogleSheetsUploader = require('./sheets-uploader');

async function generateThreadsBatch() {
    console.log('🧵 AnnotateShot Threads 콘텐츠 배치 생성');
    console.log('====================================\n');
    
    const generator = new ThreadsContentGenerator();
    
    // 1주일치 콘텐츠 생성 (일 1개씩)
    const weeklyPlan = [
        { day: 'Monday', type: 'productivity_tip', theme: '월요일 동기부여' },
        { day: 'Tuesday', type: 'feature_showcase', theme: '새 기능 소개' },
        { day: 'Wednesday', type: 'user_story', theme: '사용자 성공 사례' },
        { day: 'Thursday', type: 'behind_scenes', theme: '개발 뒷이야기' },
        { day: 'Friday', type: 'question_engagement', theme: '주말 전 토론' }
    ];
    
    console.log('📅 1주일 Threads 콘텐츠 계획:');
    console.log('────────────────────────────');
    
    const results = [];
    
    for (const plan of weeklyPlan) {
        try {
            console.log(`\n🔄 ${plan.day} (${plan.theme}) 생성 중...`);
            const content = await generator.generateThreadsContent(plan.type);
            
            results.push({
                ...plan,
                content: content,
                characterCount: content.length,
                status: content.length <= 280 ? '✅ OK' : '⚠️ 너무 길음'
            });
            
            console.log(`📏 글자수: ${content.length}/280 ${content.length <= 280 ? '✅' : '⚠️'}`);
            
            // API 제한 고려 1초 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ ${plan.day} 생성 실패:`, error.message);
            results.push({
                ...plan,
                content: `Error: ${error.message}`,
                characterCount: 0,
                status: '❌ 실패'
            });
        }
    }
    
    // 결과 출력
    console.log('\n\n🎯 === 생성된 Threads 콘텐츠 ===\n');
    
    results.forEach((result, index) => {
        console.log(`\n📱 ${index + 1}. ${result.day.toUpperCase()} - ${result.theme}`);
        console.log(`📊 타입: ${result.type} | 글자수: ${result.characterCount}/280 | ${result.status}`);
        console.log('─'.repeat(60));
        
        if (result.content.startsWith('Error:')) {
            console.log(`❌ ${result.content}`);
        } else {
            console.log(result.content);
            
            // 실용적인 피드백
            if (result.characterCount <= 280) {
                console.log('\n✅ 바로 사용 가능! (복사해서 Threads에 붙여넣기)');
            } else {
                console.log('\n⚠️  편집 필요 (280자 초과)');
                console.log(`💡 제거할 글자: ${result.characterCount - 280}자`);
            }
        }
        
        console.log('─'.repeat(60));
    });
    
    // 통계 요약
    const successCount = results.filter(r => r.characterCount > 0 && r.characterCount <= 280).length;
    const needsEditCount = results.filter(r => r.characterCount > 280).length;
    const failedCount = results.filter(r => r.characterCount === 0).length;
    
    console.log('\n\n📊 === 생성 통계 ===');
    console.log(`✅ 바로 사용 가능: ${successCount}개`);
    console.log(`⚠️  편집 필요: ${needsEditCount}개`);  
    console.log(`❌ 실패: ${failedCount}개`);
    console.log(`📏 평균 글자수: ${Math.round(results.reduce((sum, r) => sum + r.characterCount, 0) / results.length)}자`);
    
    // 사용 가이드
    console.log('\n\n📖 === 사용 가이드 ===');
    console.log('1. 위 콘텐츠를 복사해서 Threads에 붙여넣기');
    console.log('2. 280자 초과 콘텐츠는 불필요한 단어 제거');
    console.log('3. Buffer.com 등으로 예약 포스팅 설정');
    console.log('4. 매일 정해진 시간(오전 10시 권장)에 포스팅');
    console.log('\n🎯 일관성이 핵심입니다! 매일 꾸준히 포스팅하세요.');
    
    // Google Sheets 업로드 시도
    const sheetsUploader = new GoogleSheetsUploader();
    if (sheetsUploader.webAppUrl) {
        console.log('\n📊 Google Sheets에 업로드 중...');
        try {
            await sheetsUploader.uploadThreadsContent(results);
        } catch (error) {
            console.log(`⚠️  Google Sheets 업로드 실패: ${error.message}`);
        }
    } else {
        console.log('\n💡 Google Sheets 업로드를 원하면 .env 파일에 GOOGLE_SHEETS_WEBAPP_URL을 추가하세요');
    }
    
    return results;
}

// 특정 타입만 대량 생성하는 함수
async function generateSpecificType(type, count = 10) {
    console.log(`🎯 ${type} 타입 ${count}개 대량 생성`);
    console.log('═'.repeat(50));
    
    const generator = new ThreadsContentGenerator();
    const results = [];
    
    for (let i = 0; i < count; i++) {
        try {
            console.log(`🔄 ${i + 1}/${count} 생성 중...`);
            const content = await generator.generateThreadsContent(type);
            
            results.push({
                index: i + 1,
                content: content,
                characterCount: content.length,
                suitable: content.length <= 280
            });
            
            console.log(`  📏 ${content.length}/280자 ${content.length <= 280 ? '✅' : '⚠️'}`);
            
            // API 제한 고려
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
        } catch (error) {
            console.error(`❌ ${i + 1}번째 생성 실패:`, error.message);
        }
    }
    
    // 결과 필터링 (280자 이하만)
    const suitable = results.filter(r => r.suitable);
    
    console.log(`\n\n🎯 === ${type} 사용 가능한 콘텐츠 (${suitable.length}/${count}개) ===\n`);
    
    suitable.forEach((result) => {
        console.log(`📱 ${result.index}번 (${result.characterCount}자)`);
        console.log('─'.repeat(50));
        console.log(result.content);
        console.log('─'.repeat(50));
        console.log('✅ 복사해서 사용하세요!\n');
    });
}

// CLI 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'batch') {
        generateThreadsBatch();
    } else if (command === 'type') {
        const type = args[1] || 'productivity_tip';
        const count = parseInt(args[2]) || 5;
        generateSpecificType(type, count);
    } else {
        console.log('🚀 Threads 콘텐츠 생성 도구');
        console.log('════════════════════════');
        console.log('사용법:');
        console.log('  node generate-threads-batch.js batch           # 1주일치 생성');
        console.log('  node generate-threads-batch.js type [타입] [개수] # 특정 타입 대량 생성');
        console.log('');
        console.log('사용 가능한 타입:');
        console.log('  - productivity_tip');
        console.log('  - feature_showcase'); 
        console.log('  - behind_scenes');
        console.log('  - user_story');
        console.log('  - question_engagement');
        console.log('');
        console.log('예시:');
        console.log('  node generate-threads-batch.js type productivity_tip 10');
        
        // 기본 실행
        generateThreadsBatch();
    }
}

module.exports = { generateThreadsBatch, generateSpecificType };