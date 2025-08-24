const snoowrap = require('snoowrap');
require('dotenv').config();

class RedditOAuthClient {
    constructor() {
        // OAuth 방식 - 비밀번호 불필요
        this.reddit = new snoowrap({
            userAgent: 'AnnotateShot Marketing Bot v1.0.0 by /u/Visual_Diet1286',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            refreshToken: process.env.REDDIT_REFRESH_TOKEN
        });
        
        this.reddit.config({ requestDelay: 1000 });
    }

    async getAuthUrl() {
        // OAuth 인증 URL 생성
        const authUrl = snoowrap.getAuthUrl({
            clientId: process.env.REDDIT_CLIENT_ID,
            scope: ['identity', 'submit', 'read'],
            redirectUri: 'http://localhost:3000/callback',
            permanent: true,
            state: 'annotateshot-auth'
        });

        console.log('🔗 다음 URL로 이동해서 인증하세요:');
        console.log(authUrl);
        console.log('\n인증 후 받은 code를 입력해주세요.');
        
        return authUrl;
    }

    async exchangeCodeForToken(authCode) {
        try {
            const refreshToken = await snoowrap.fromAuthCode({
                code: authCode,
                userAgent: 'AnnotateShot Marketing Bot v1.0.0',
                clientId: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET,
                redirectUri: 'http://localhost:3000/callback'
            });

            console.log('✅ Refresh Token 획득 성공!');
            console.log('다음을 .env 파일에 추가하세요:');
            console.log(`REDDIT_REFRESH_TOKEN=${refreshToken.refreshToken}`);
            
            return refreshToken.refreshToken;
        } catch (error) {
            console.error('❌ 토큰 교환 실패:', error.message);
            return null;
        }
    }

    async testConnection() {
        try {
            const user = await this.reddit.getMe();
            console.log(`✅ Reddit OAuth 연결 성공! 사용자: ${user.name}`);
            return true;
        } catch (error) {
            console.error('❌ Reddit OAuth 연결 실패:', error.message);
            return false;
        }
    }

    async checkUserKarma() {
        try {
            const user = await this.reddit.getMe();
            console.log(`📊 계정 상태:`);
            console.log(`- 사용자명: ${user.name}`);
            console.log(`- 댓글 카르마: ${user.comment_karma}`);
            console.log(`- 링크 카르마: ${user.link_karma}`);
            console.log(`- 계정 생성일: ${new Date(user.created_utc * 1000).toLocaleDateString()}`);
            
            return {
                username: user.name,
                commentKarma: user.comment_karma,
                linkKarma: user.link_karma,
                totalKarma: user.comment_karma + user.link_karma,
                accountAge: Date.now() - (user.created_utc * 1000)
            };
        } catch (error) {
            console.error('카르마 조회 실패:', error.message);
            return null;
        }
    }

    async canPostToSubreddit(subreddit) {
        try {
            const recentPosts = await this.reddit.getMe().getSubmissions({ limit: 10 });
            
            // 같은 서브레딧에 최근 24시간 내 게시했는지 확인
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentPostsInSub = recentPosts.filter(post => 
                post.subreddit.display_name.toLowerCase() === subreddit.toLowerCase() &&
                post.created_utc * 1000 > oneDayAgo
            );

            if (recentPostsInSub.length > 0) {
                console.warn(`⚠️ r/${subreddit}에 24시간 내 게시 기록이 있습니다. 스팸으로 간주될 수 있습니다.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`게시 가능 여부 확인 실패:`, error.message);
            return false;
        }
    }

    async submitPost(subreddit, title, text, options = {}) {
        try {
            console.log(`📝 r/${subreddit}에 게시물 업로드 중...`);
            
            const submission = await this.reddit
                .getSubreddit(subreddit)
                .submitSelfpost({
                    title: title,
                    text: text,
                    sendReplies: options.sendReplies !== false,
                    nsfw: options.nsfw || false,
                    spoiler: options.spoiler || false,
                    resubmit: options.resubmit !== false
                });

            console.log(`✅ 게시물 업로드 완료!`);
            console.log(`🔗 URL: https://reddit.com${submission.permalink}`);
            
            return {
                success: true,
                id: submission.id,
                permalink: submission.permalink,
                url: `https://reddit.com${submission.permalink}`
            };

        } catch (error) {
            console.error(`❌ r/${subreddit} 게시 실패:`, error.message);
            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode
            };
        }
    }
}

module.exports = RedditOAuthClient;