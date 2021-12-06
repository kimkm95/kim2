module.exports = function(app){
    const diary = require('./diaryController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    // API No. 12 홈 배경 컬러 조회 API
    app.get('/app/diarys/home', jwtMiddleware, diary.getHome);

    // API No. 13 홈 기본 칼러 조회 API
    app.get('/app/diarys/basicColor',jwtMiddleware, diary.getBasicColor);

    // API No. 14 홈 마이 칼러 조회 API
    app.get('/app/diarys/myColor',jwtMiddleware, diary.getMyColor);

    // API No. 15 홈 마이 칼러 등록 및 수정 API
    app.post('/app/diarys/myColor/status',jwtMiddleware, diary.postMyColor);

    // API No. 16 색갈피 끼우기 --> 마이컬러를 이용한 다이어리 등록 API
    app.post('/app/diarys/myColor/diary',jwtMiddleware, diary.postMyColorDiary);

    // API No. 17 마이 컬러 리셋 API
    app.patch('/app/diarys/myColor/reset',jwtMiddleware, diary.patchMyColorReset);

    // API No. 17 홈 컬러 등록 API
    app.post('/app/diarys/home/color',jwtMiddleware, diary.postHomeColor);
    //
    // API No. 18 컬러 변경 API
    app.patch('/app/diarys/status/color',jwtMiddleware, diary.patchColor);

    // API No. 19 현재 달 감정기록 조회 API
    app.get('/app/diarys/current-month',jwtMiddleware, diary.getCurrentMonthDiary);

    // API No. 20 찾으려는 달 감정기록 조회 API
    app.get('/app/diarys/selected-month/:page',jwtMiddleware, diary.getSelectedMonthDiary);

    // API No. 20 찾으려는 달 감정기록 조회 API -- page 없는 버전 API
    app.get('/app/diarys/targeted-month',jwtMiddleware, diary.getTargetMonthDiary);

    // API No. 21 달력 별 감정기록 조회 API
    app.get('/app/diarys/calender/month',jwtMiddleware, diary.getMonthDiary);

    // API No. 22 특정 날짜 감정기록 조회 API
    app.get('/app/diarys/:diaryId/date',jwtMiddleware, diary.getDiary);

    // API No. 23 다이어리 등록 API
    app.post('/app/diarys/date',jwtMiddleware, diary.postDiary);

    // API No. 24 다이어리 수정 API
    app.patch('/app/diarys/:diaryId/date',jwtMiddleware, diary.patchDiary);

    // API No. 25 다이어리 이미지 수정 API
    app.patch('/app/diarys/:diaryImgId/image',jwtMiddleware, diary.patchDiaryImg);

    // API No. 26 다이어리 통합 수정 API
    app.patch('/app/diarys/editing',jwtMiddleware, diary.patchCombinedDiary);

    // API No. 26 가장 많이 사용한 3 색상 조회 API
    app.get('/app/diarys/user/mostColor',jwtMiddleware, diary.getUserMostColor);

    // API No. 27 다이어리 삭제 API
    app.patch('/app/diarys/withdrawal/:diaryId',jwtMiddleware, diary.withdrawDiary );
};
