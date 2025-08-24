const snoowrap = require('snoowrap');
require('dotenv').config();

class RedditAPIClient {
    constructor() {
        this.reddit = new snoowrap({
            userAgent: 'AnnotateShot Marketing Bot v1.0.0 by /u/YourUsername',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            username: process.env.REDDIT_USERNAME, // 추가 필요
            password: process.env.REDDIT_PASSWORD  // 추가 필요
        });
        
        // Rate limiting settings
        this.reddit.config({ requestDelay: 1000 }); // 1초 딜레이
    }

    async testConnection() {
        try {
            const user = await this.reddit.getMe();
            console.log(`✅ Reddit API 연결 성공! 사용자: ${user.name}`);
            return true;
        } catch (error) {
            console.error('❌ Reddit API 연결 실패:', error.message);
            return false;
        }
    }

    async submitPost(subreddit, title, text, options = {}) {
        try {
            const {
                flair = null,
                sendReplies = true,
                nsfw = false,
                spoiler = false,
                resubmit = true
            } = options;

            console.log(`📝 r/${subreddit}에 게시물 업로드 중...`);
            console.log(`제목: ${title.substring(0, 50)}...`);

            const submission = await this.reddit
                .getSubreddit(subreddit)
                .submitSelfpost({
                    title: title,
                    text: text,
                    sendReplies: sendReplies,
                    nsfw: nsfw,
                    spoiler: spoiler,
                    resubmit: resubmit
                });

            // 플레어 설정 (옵션)
            if (flair) {
                try {
                    await submission.selectFlair({ text: flair });
                } catch (error) {
                    console.warn(`⚠️ 플레어 설정 실패: ${error.message}`);
                }
            }

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
            
            // 에러 타입별 처리
            if (error.statusCode === 403) {
                console.error('권한 없음: 해당 서브레딧에 게시할 권한이 없습니다.');
            } else if (error.statusCode === 429) {
                console.error('Rate Limit: 너무 많은 요청. 잠시 후 다시 시도하세요.');
            } else if (error.message.includes('RATELIMIT')) {
                console.error('Reddit Rate Limit 도달. 10분 후 재시도 권장.');
            }

            return {
                success: false,
                error: error.message,
                statusCode: error.statusCode
            };
        }
    }

    async getSubredditRules(subreddit) {
        try {
            const sub = await this.reddit.getSubreddit(subreddit);
            const rules = await sub.getRules();
            
            console.log(`📋 r/${subreddit} 규칙:`);
            rules.forEach((rule, index) => {
                console.log(`${index + 1}. ${rule.short_name}: ${rule.description}`);
            });
            
            return rules;
        } catch (error) {
            console.error(`규칙 조회 실패 (r/${subreddit}):`, error.message);
            return [];
        }
    }

    async checkUserKarma() {
        try {
            const user = await this.reddit.getMe();
            console.log(`📊 계정 상태:`);
            console.log(`- 댓글 카르마: ${user.comment_karma}`);
            console.log(`- 링크 카르마: ${user.link_karma}`);
            console.log(`- 계정 생성일: ${new Date(user.created_utc * 1000).toLocaleDateString()}`);
            
            return {
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

    async schedulePost(subreddit, title, text, delayMinutes = 0, options = {}) {
        console.log(`⏰ ${delayMinutes}분 후 r/${subreddit}에 게시 예약됨`);
        
        return new Promise((resolve) => {
            setTimeout(async () => {
                const result = await this.submitPost(subreddit, title, text, options);
                resolve(result);
            }, delayMinutes * 60 * 1000);
        });
    }

    // 안전 장치: 스팸 방지
    async canPostToSubreddit(subreddit) {
        try {
            const sub = await this.reddit.getSubreddit(subreddit);
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
}

module.exports = RedditAPIClient;