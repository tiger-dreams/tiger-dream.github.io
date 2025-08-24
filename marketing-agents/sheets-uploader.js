require('dotenv').config();
const https = require('https');

class GoogleSheetsUploader {
    constructor() {
        this.webAppUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
        // Google Apps Script Web App URL이 필요합니다
        // 예: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
    }

    async uploadToSheets(data) {
        if (!this.webAppUrl) {
            console.error('❌ GOOGLE_SHEETS_WEBAPP_URL이 설정되지 않았습니다');
            console.log('💡 Google Apps Script Web App URL을 .env 파일에 추가해주세요');
            return false;
        }

        try {
            // 이미 호출부에서 올바른 payload(action 포함)를 구성하므로, 그대로 전달합니다.
            const result = await this.postToWebApp(data);
            return result;

        } catch (error) {
            console.error('❌ Google Sheets 업로드 실패:', error.message);
            return false;
        }
    }

    async postToWebApp(payload) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const byteLength = Buffer.byteLength(data, 'utf8');

            const url = new URL(this.webAppUrl);
            
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': byteLength
                }
            };

            const req = https.request(options, (res) => {
                // 리다이렉트 처리
                if (res.statusCode === 302 || res.statusCode === 301) {
                    const redirectUrl = res.headers.location;
                    console.log('📋 리다이렉트 감지:', redirectUrl);
                    
                    // Apps Script는 /macros/echo?... 로 리다이렉트하지만,
                    // 실제 POST 실행 엔드포인트는 script.googleusercontent.com/macros/s/<DEPLOY_ID>/exec 입니다.
                    // 리다이렉트 URL의 lib 파라미터(배포 ID)를 추출하여 올바른 실행 URL로 POST합니다.
                    try {
                        const loc = new URL(redirectUrl);
                        const lib = loc.searchParams.get('lib');
                        if (!lib) {
                            return reject(new Error('리다이렉트 URL에 배포 ID(lib)가 없습니다. 배포 설정을 확인하세요.'));
                        }
                        // 최종 실행 엔드포인트는 쿼리스트링 없이 /exec 로 호출해야 합니다.
                        const finalUrl = new URL(`https://script.googleusercontent.com/macros/s/${lib}/exec`);

                        const followReq = https.request({
                            hostname: finalUrl.hostname,
                            path: finalUrl.pathname + finalUrl.search,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': byteLength
                            }
                        }, (followRes) => {
                            let followBody = '';
                            followRes.on('data', (chunk) => followBody += chunk);
                            followRes.on('end', () => {
                                try {
                                    const response = JSON.parse(followBody);
                                    if (response.success) {
                                        console.log('✅ Google Sheets 업로드 성공!');
                                        console.log(`🔗 시트 URL: ${response.sheetUrl || 'N/A'}`);
                                        return resolve(response);
                                    }
                                    return reject(new Error(response.error || 'Unknown error'));
                                } catch (e) {
                                    console.log('📋 최종 응답 내용:', followBody);
                                    console.log('📋 최종 응답 상태 코드:', followRes.statusCode);
                                    if (followRes.statusCode === 200) {
                                        console.log('✅ Google Sheets 업로드 완료 (응답 파싱 불가)');
                                        return resolve({ success: true });
                                    }
                                    return reject(new Error(`최종 응답 파싱 실패: ${e.message}`));
                                }
                            });
                        });

                        followReq.on('error', (error) => reject(error));
                        followReq.write(data);
                        followReq.end();
                        return;
                    } catch (redirErr) {
                        return reject(redirErr);
                    }
                }
                
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.success) {
                            console.log('✅ Google Sheets 업로드 성공!');
                            console.log(`🔗 시트 URL: ${response.sheetUrl || 'N/A'}`);
                            resolve(response);
                        } else {
                            reject(new Error(response.error || 'Unknown error'));
                        }
                    } catch (e) {
                        console.log('📋 원본 응답 내용:', body);
                        console.log('📋 응답 상태 코드:', res.statusCode);
                        
                        // HTML 응답인 경우 (성공적인 경우가 많음)
                        if (body.includes('success') || res.statusCode === 200) {
                            console.log('✅ Google Sheets 업로드 완료 (응답 파싱 불가)');
                            resolve({ success: true });
                        } else {
                            reject(new Error(`응답 파싱 실패: ${e.message}`));
                        }
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(data);
            req.end();
        });
    }

    formatThreadsData(threadsResults) {
        const headers = ['날짜', '요일', '콘텐츠 타입', '글자수', '상태', '콘텐츠', '해시태그', '생성시간'];
        
        const rows = threadsResults.map(result => {
            const hashtags = this.extractHashtags(result.content);
            const cleanContent = result.content.replace(/#\w+/g, '').trim();
            
            return [
                new Date().toLocaleDateString('ko-KR'),
                result.day || 'N/A',
                result.type || 'Unknown',
                result.characterCount || result.content.length,
                result.characterCount <= 280 ? '✅ 사용가능' : '⚠️ 편집필요',
                cleanContent,
                hashtags.join(', '),
                new Date().toLocaleString('ko-KR')
            ];
        });

        return {
            headers: headers,
            rows: rows
        };
    }

    extractHashtags(content) {
        const hashtagRegex = /#\w+/g;
        return content.match(hashtagRegex) || [];
    }

    async uploadThreadsContent(threadsResults) {
        console.log('📊 Google Sheets에 Threads 콘텐츠 업로드 중...');
        
        const formattedData = this.formatThreadsData(threadsResults);
        
        const payload = {
            action: 'addThreadsContent',
            headers: formattedData.headers,
            rows: formattedData.rows,
            timestamp: new Date().toISOString(),
            totalCount: threadsResults.length,
            readyCount: threadsResults.filter(r => (r.characterCount || r.content.length) <= 280).length
        };

        const result = await this.uploadToSheets(payload);
        
        if (result) {
            console.log(`📈 ${formattedData.rows.length}개 콘텐츠가 Google Sheets에 추가되었습니다!`);
        }
        
        return result;
    }
}

module.exports = GoogleSheetsUploader;