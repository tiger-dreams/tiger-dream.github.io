const ContentMarketingAgent = require('./content-marketing-agent');
const CommunityMarketingAgent = require('./community-marketing-agent');
require('dotenv').config();

async function testMarketingAgents() {
    console.log('🚀 Testing AnnotateShot Marketing Agents');
    console.log('=======================================\n');

    const contentAgent = new ContentMarketingAgent();
    const communityAgent = new CommunityMarketingAgent();

    try {
        // Test 1: Generate Twitter content
        console.log('📱 Generating Twitter content...');
        const twitterContent = await contentAgent.generateSocialMediaContent('twitter');
        console.log('Twitter Posts:', twitterContent);
        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Generate Reddit content
        console.log('💬 Generating Reddit post for r/productivity...');
        const redditPost = await communityAgent.generateRedditContent('r/productivity', 'helpful_post');
        console.log('Reddit Post:', redditPost);
        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Generate SEO blog post
        console.log('📝 Generating SEO blog post...');
        const blogPost = await contentAgent.generateSEOBlogPost('screenshot annotation productivity tips');
        console.log('Blog Post:', blogPost?.substring(0, 500) + '...');
        console.log('\n' + '='.repeat(50) + '\n');

        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMarketingAgents();