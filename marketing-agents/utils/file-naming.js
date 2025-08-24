// 파일명 생성 유틸리티
function generateFileName(type, subreddit = '', timestamp = new Date()) {
    const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
    
    const fileNames = {
        'reddit_post': `annotateshot_reddit_${subreddit}_${dateStr}_${timeStr}`,
        'blog_post': `annotateshot_blog_${dateStr}_${timeStr}`,
        'social_content': `annotateshot_social_${dateStr}_${timeStr}`,
        'marketing_report': `annotateshot_report_${dateStr}_${timeStr}`
    };

    return fileNames[type] || `annotateshot_content_${dateStr}_${timeStr}`;
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function getFormattedDate() {
    return new Date().toLocaleDateString('ko-KR');
}

module.exports = {
    generateFileName,
    getCurrentTimestamp,
    getFormattedDate
};