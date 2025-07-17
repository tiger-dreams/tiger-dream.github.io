// AnnotateShot 사용량 모니터링 스크립트
class UsageMonitor {
    constructor() {
        this.storageKey = 'annotateshot_usage_analytics';
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
        this.checkDailyUsage();
    }

    // 페이지뷰 추적
    trackPageView() {
        const today = this.getToday();
        const usage = this.getUsageData();
        
        if (!usage[today]) {
            usage[today] = this.getEmptyDayData();
        }
        
        usage[today].pageViews++;
        usage[today].lastVisit = new Date().toISOString();
        
        this.saveUsageData(usage);
        console.log(`📊 Page view tracked for ${today}`);
    }

    // 특정 액션 추적
    trackAction(actionType, details = {}) {
        const today = this.getToday();
        const usage = this.getUsageData();
        
        if (!usage[today]) {
            usage[today] = this.getEmptyDayData();
        }
        
        // 액션별 카운트 증가
        if (usage[today].actions[actionType]) {
            usage[today].actions[actionType]++;
        } else {
            usage[today].actions[actionType] = 1;
        }
        
        // 상세 정보 저장
        if (!usage[today].actionDetails[actionType]) {
            usage[today].actionDetails[actionType] = [];
        }
        usage[today].actionDetails[actionType].push({
            timestamp: new Date().toISOString(),
            ...details
        });
        
        this.saveUsageData(usage);
        console.log(`🎯 Action tracked: ${actionType}`);
    }

    // Extension 사용량 추적
    trackExtensionUsage(captureType) {
        this.trackAction('extensionCapture', { 
            type: captureType,
            source: 'chrome-extension'
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 이미지 로드 추적
        const originalLoadImage = window.loadImage;
        if (originalLoadImage) {
            window.loadImage = (...args) => {
                this.trackAction('imageLoaded');
                return originalLoadImage.apply(this, args);
            };
        }

        // 저장 기능 추적
        const originalSaveImage = window.saveImage;
        if (originalSaveImage) {
            window.saveImage = (...args) => {
                this.trackAction('imageSaved');
                return originalSaveImage.apply(this, args);
            };
        }

        // 클립보드 복사 추적
        const originalCopyToClipboard = window.copyToClipboard;
        if (originalCopyToClipboard) {
            window.copyToClipboard = (...args) => {
                this.trackAction('clipboardCopy');
                return originalCopyToClipboard.apply(this, args);
            };
        }
    }

    // 일일 사용량 요약
    getDailySummary(date = this.getToday()) {
        const usage = this.getUsageData();
        const dayData = usage[date];
        
        if (!dayData) return null;
        
        const totalActions = Object.values(dayData.actions).reduce((sum, count) => sum + count, 0);
        
        return {
            date,
            pageViews: dayData.pageViews,
            totalActions,
            actions: dayData.actions,
            estimatedDataUsage: this.estimateDataUsage(dayData)
        };
    }

    // 월간 사용량 요약
    getMonthlySummary(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
        const usage = this.getUsageData();
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        const monthlyData = Object.entries(usage)
            .filter(([date]) => date.startsWith(monthKey))
            .map(([date, data]) => ({ date, ...data }));
        
        const summary = {
            period: `${year}-${month}`,
            totalDays: monthlyData.length,
            totalPageViews: monthlyData.reduce((sum, day) => sum + day.pageViews, 0),
            totalActions: monthlyData.reduce((sum, day) => 
                sum + Object.values(day.actions).reduce((daySum, count) => daySum + count, 0), 0),
            estimatedBandwidth: this.estimateBandwidthUsage(monthlyData),
            dailyAverage: 0
        };
        
        summary.dailyAverage = Math.round(summary.totalPageViews / Math.max(summary.totalDays, 1));
        
        return summary;
    }

    // 대역폭 사용량 추정
    estimateBandwidthUsage(monthlyData) {
        // 페이지당 평균 대역폭 (KB) - HTML, CSS, JS, 이미지 포함
        const avgPageSize = 500; // KB
        const totalPageViews = monthlyData.reduce((sum, day) => sum + day.pageViews, 0);
        
        return {
            estimatedMB: Math.round((totalPageViews * avgPageSize) / 1024),
            estimatedGB: Math.round((totalPageViews * avgPageSize) / (1024 * 1024) * 100) / 100,
            percentOfLimit: Math.round((totalPageViews * avgPageSize) / (100 * 1024 * 1024) * 10000) / 100
        };
    }

    // 데이터 사용량 추정
    estimateDataUsage(dayData) {
        const pageSize = 500; // KB per page
        const actionSize = 50; // KB per action (평균)
        const totalActions = Object.values(dayData.actions).reduce((sum, count) => sum + count, 0);
        
        return {
            pageViewsKB: dayData.pageViews * pageSize,
            actionsKB: totalActions * actionSize,
            totalKB: (dayData.pageViews * pageSize) + (totalActions * actionSize)
        };
    }

    // 사용량 경고 체크
    checkDailyUsage() {
        const today = this.getToday();
        const currentMonth = today.substring(0, 7); // YYYY-MM
        const [year, month] = currentMonth.split('-');
        const monthlySummary = this.getMonthlySummary(parseInt(year), parseInt(month));
        
        // 경고 임계값
        const warnings = [];
        
        if (monthlySummary.estimatedBandwidth.percentOfLimit > 80) {
            warnings.push(`⚠️ 대역폭 사용량: ${monthlySummary.estimatedBandwidth.percentOfLimit}% (${monthlySummary.estimatedBandwidth.estimatedGB}GB/100GB)`);
        }
        
        if (monthlySummary.totalPageViews > 50000) {
            warnings.push(`⚠️ 월간 페이지뷰: ${monthlySummary.totalPageViews.toLocaleString()}회 (높은 트래픽)`);
        }
        
        if (warnings.length > 0) {
            console.warn('🚨 사용량 경고:', warnings);
            this.showUsageWarning(warnings);
        }
    }

    // 경고 메시지 표시
    showUsageWarning(warnings) {
        // 개발자용 콘솔 경고
        console.group('📊 AnnotateShot 사용량 모니터링');
        warnings.forEach(warning => console.warn(warning));
        console.log('💡 Vercel 이전을 고려해보세요: https://vercel.com');
        console.groupEnd();
    }

    // 유틸리티 메서드들
    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getEmptyDayData() {
        return {
            pageViews: 0,
            actions: {},
            actionDetails: {},
            firstVisit: new Date().toISOString(),
            lastVisit: new Date().toISOString()
        };
    }

    getUsageData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch (e) {
            console.error('Usage data parsing error:', e);
            return {};
        }
    }

    saveUsageData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Usage data saving error:', e);
        }
    }

    // 관리자용 메서드들
    exportUsageData() {
        const data = this.getUsageData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotateshot-usage-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearUsageData() {
        if (confirm('정말로 모든 사용량 데이터를 삭제하시겠습니까?')) {
            localStorage.removeItem(this.storageKey);
            console.log('✅ 사용량 데이터가 삭제되었습니다.');
        }
    }

    showStats() {
        const currentMonth = this.getToday().substring(0, 7);
        const [year, month] = currentMonth.split('-');
        const monthlySummary = this.getMonthlySummary(parseInt(year), parseInt(month));
        
        console.group('📊 AnnotateShot 사용량 통계');
        console.log('기간:', monthlySummary.period);
        console.log('총 사용일:', monthlySummary.totalDays);
        console.log('총 페이지뷰:', monthlySummary.totalPageViews.toLocaleString());
        console.log('일평균 페이지뷰:', monthlySummary.dailyAverage);
        console.log('총 액션:', monthlySummary.totalActions.toLocaleString());
        console.log('추정 대역폭:', `${monthlySummary.estimatedBandwidth.estimatedGB}GB (${monthlySummary.estimatedBandwidth.percentOfLimit}%)`);
        console.groupEnd();
        
        return monthlySummary;
    }
}

// 전역 인스턴스 생성
window.usageMonitor = new UsageMonitor();

// 콘솔에서 사용할 수 있는 전역 함수들
window.showUsageStats = () => window.usageMonitor.showStats();
window.exportUsageData = () => window.usageMonitor.exportUsageData();