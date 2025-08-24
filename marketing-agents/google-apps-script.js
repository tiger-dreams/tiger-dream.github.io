/**
 * Google Apps Script 코드
 * 이 코드를 script.google.com에 붙여넣고 웹앱으로 배포하세요
 */

// 스프레드시트 ID - 여기에 실제 스프레드시트 ID를 입력하세요
const SPREADSHEET_ID = '1aE9zfQhkp4m5YJU4JnZ4VKZ7BjtizBOGMv9459UKtMM'; 
// 스프레드시트 URL에서 /d/ 다음과 /edit 사이의 긴 문자열

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addThreadsContent') {
      return addThreadsContent(data);
    } else if (data.action === 'addContent') {
      return addGeneralContent(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addThreadsContent(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 'Threads Content' 시트 찾기 또는 생성
    let sheet = ss.getSheetByName('Threads Content');
    if (!sheet) {
      sheet = ss.insertSheet('Threads Content');
      
      // 헤더 추가
      const headers = data.headers || [
        '날짜', '요일', '콘텐츠 타입', '글자수', '상태', '콘텐츠', '해시태그', '생성시간'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 헤더 스타일링
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // 데이터 추가
    if (data.rows && data.rows.length > 0) {
      const lastRow = sheet.getLastRow();
      const startRow = lastRow + 1;
      
      sheet.getRange(startRow, 1, data.rows.length, data.rows[0].length)
        .setValues(data.rows);
      
      // 상태 컬럼 조건부 서식
      const statusColumn = 5; // '상태' 컬럼
      const statusRange = sheet.getRange(startRow, statusColumn, data.rows.length, 1);
      
      // 조건부 서식 규칙
      const rules = sheet.getConditionalFormatRules();
      
      // ✅ 사용가능 - 녹색
      const greenRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('✅')
        .setBackground('#d9ead3')
        .setRanges([statusRange])
        .build();
      
      // ⚠️ 편집필요 - 노란색
      const yellowRule = SpreadsheetApp.newConditionalFormatRule()
        .whenTextContains('⚠️')
        .setBackground('#fff2cc')
        .setRanges([statusRange])
        .build();
      
      rules.push(greenRule, yellowRule);
      sheet.setConditionalFormatRules(rules);
      
      // 컬럼 폭 자동 조정
      sheet.autoResizeColumns(1, data.headers.length);
      
      // 콘텐츠 컬럼은 수동으로 넓게
      sheet.setColumnWidth(6, 400); // 콘텐츠 컬럼
    }
    
    // 통계 시트 업데이트
    updateStatsSheet(ss, data);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `${data.rows.length}개 항목 추가됨`,
        sheetUrl: ss.getUrl(),
        readyCount: data.readyCount,
        totalCount: data.totalCount
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in addThreadsContent: ' + error.toString());
    throw error;
  }
}

function updateStatsSheet(spreadsheet, data) {
  try {
    let statsSheet = spreadsheet.getSheetByName('통계');
    if (!statsSheet) {
      statsSheet = spreadsheet.insertSheet('통계');
      
      // 헤더 추가
      const headers = ['날짜', '총 생성', '사용 가능', '편집 필요', '성공률(%)'];
      statsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      const headerRange = statsSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#34a853');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // 오늘 날짜의 통계 업데이트 또는 추가
    const today = new Date().toLocaleDateString('ko-KR');
    const lastRow = statsSheet.getLastRow();
    
    let targetRow = -1;
    if (lastRow > 1) {
      const dates = statsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < dates.length; i++) {
        if (dates[i][0] === today) {
          targetRow = i + 2; // 1-based + header row
          break;
        }
      }
    }
    
    const totalCount = data.totalCount || 0;
    const readyCount = data.readyCount || 0;
    const successRate = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
    
    const statsRow = [
      today,
      totalCount,
      readyCount,
      totalCount - readyCount,
      successRate
    ];
    
    if (targetRow > 0) {
      // 기존 행 업데이트
      statsSheet.getRange(targetRow, 1, 1, statsRow.length).setValues([statsRow]);
    } else {
      // 새 행 추가
      statsSheet.getRange(lastRow + 1, 1, 1, statsRow.length).setValues([statsRow]);
    }
    
    // 컬럼 폭 조정
    statsSheet.autoResizeColumns(1, statsRow.length);
    
  } catch (error) {
    Logger.log('Error in updateStatsSheet: ' + error.toString());
    // 통계 업데이트 실패는 전체 프로세스를 중단시키지 않음
  }
}

function addGeneralContent(data) {
  // 일반 콘텐츠 추가 함수 (확장 가능)
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'General content added'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 테스트 함수
function testFunction() {
  const testData = {
    action: 'addThreadsContent',
    headers: ['날짜', '타입', '콘텐츠', '글자수'],
    rows: [
      [new Date().toLocaleDateString('ko-KR'), 'productivity_tip', '테스트 콘텐츠', 50]
    ],
    totalCount: 1,
    readyCount: 1
  };
  
  const result = addThreadsContent(testData);
  Logger.log(result.getContent());
}