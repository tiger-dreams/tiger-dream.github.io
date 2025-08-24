const ContentMarketingAgent = require('./content-marketing-agent');
const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function generateContentBatch() {
    console.log('🎯 AnnotateShot 마케팅 콘텐츠 생성');
    console.log('=================================\n');

    const contentAgent = new ContentMarketingAgent();
    const communityAgent = new CommunityMarketingAgent();

    try {
        // 1. Twitter 콘텐츠 (5개 포스트)
        console.log('📱 Twitter 콘텐츠 생성 중...\n');
        const twitterContent = await contentAgent.generateSocialMediaContent('twitter');
        console.log('🐦 TWITTER 포스트들:');
        console.log(twitterContent);
        console.log('\n' + '='.repeat(60) + '\n');

        // 2. Reddit 포스트 (r/productivity)
        console.log('💬 Reddit 포스트 생성 중...\n');
        const redditPost = await communityAgent.generateRedditContent('r/productivity', 'helpful_post');
        console.log('📝 REDDIT 포스트 (r/productivity):');
        console.log(redditPost);
        console.log('\n' + '='.repeat(60) + '\n');

        // 3. Instagram 콘텐츠
        console.log('📸 Instagram 콘텐츠 생성 중...\n');
        const instagramContent = await contentAgent.generateSocialMediaContent('instagram');
        console.log('📷 INSTAGRAM 캐러셀:');
        console.log(instagramContent);
        console.log('\n' + '='.repeat(60) + '\n');

        // 4. YouTube 스크립트
        console.log('🎥 YouTube 스크립트 생성 중...\n');
        const youtubeScript = await contentAgent.generateSocialMediaContent('youtube');
        console.log('🎬 YOUTUBE 비디오 스크립트:');
        console.log(youtubeScript);
        console.log('\n' + '='.repeat(60) + '\n');

        console.log('✅ 모든 콘텐츠 생성 완료!');
        console.log('\n📋 생성된 콘텐츠 요약:');
        console.log('- Twitter: 5개 포스트');
        console.log('- Reddit: 커뮤니티 참여 포스트');
        console.log('- Instagram: 캐러셀 콘텐츠');
        console.log('- YouTube: 튜토리얼 스크립트');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

generateContentBatch();