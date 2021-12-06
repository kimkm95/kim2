const jwtMiddleware = require("../../../config/jwtMiddleware");
const diaryProvider = require("../../app/Diary/diaryProvider");
const userProvider = require("../../app/User/userProvider");
const diaryService = require("../../app/Diary/diaryService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");

const {emit} = require("nodemon");
const { SUCCESS } = require("../../../config/baseResponseStatus");
const moment = require('moment');

// regex
const regNum = /^(0|[1-9]+[0-9]*)$/;
const regPassword = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,16}/;
const regexEmail = require("regex-email");
const regPhoneNumber = /^\d{3}\d{3,4}\d{4}$/;
var reghex = /^#(?:[0-9a-f]{3}){1,2}$/i;
var regDate = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
var regDateMonth = /^(19|20)\d{2}-(0[1-9]|1[012])$/;
const regStatus = /^([Y|N])?$/;
const regPage = /^(0|[-]?[1-9]\d*)$/;

/**
 * API No. 10
 * API Name : 홈 컬러 조회 API
 * [GET] /app/diarys/home
 */
function dateFormat(date) {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day;
}

exports.getHome = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var date = new Date();
    date = dateFormat(date)

    // Validation Check (Request Error)
    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 날짜 정규표현식 YYYY-MM-DD
    if(!regDate.test(date)) {
        return res.send(errResponse(baseResponse.SIGNUP_DATE_ERROR_TYPE));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // Home Result // color 입력 후
    const homeResult = await diaryProvider.retrieveTodayDiary(userId);
    // 오늘 날짜 기록이 존재한다면
    if (homeResult.length > 0) {
        return res.send(response(baseResponse.DIARY_TODAY_VIEW_SUCCESS, homeResult));
    }
    // 오늘 날짜 기록 입력 전
    else {
        const userHistoryResult = await diaryProvider.userHistoryCheck(userId);
        // 과거 감정 색을 입력한 기록이 있는 경우
        if (userHistoryResult.length > 0) {
            // console.log(userHistoryResult[0]) >> 가장 최신의 날짜 정보 가져오기
            return res.send(response(baseResponse.DIARY_RECENT_VIEW_SUCCESS, userHistoryResult[0]));
        }
        else{
            // 한번도 감정 색을 입력한 기록이 없는 경우
            return res.send(response(baseResponse.NO_HISTORY_DATA));
        }
    }
}

/**
 * API No. 11
 * API Name : 홈 컬러 조회 API
 * [GET] /app/diarys/basicColor
 */

exports.getBasicColor = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    console.log(userId)

    // // Validation Check (Request Error)
    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 색을 올린 기록이 있는가?
    const checkDiary = await diaryProvider.userHistoryCheck(userId);
    // 없다면 기본 컬러값만 조회
    if(checkDiary.length === 0){
        const homeResult = await diaryProvider.retrieveBasicColor();
        return res.send(response(baseResponse.SUCCESS, homeResult));
    }
    // 있다면 가장 많이 사용한 컬러값을 기준으로 최신화
    const homeColorView = await diaryProvider.retrieveUserColor(userId);
    return res.send(response(baseResponse.SUCCESS, homeColorView));
}

/**
 * API No. 26
 * API Name : 가장 많이 사용한 3 색상 조회 API
 * [GET] /app/diarys/user/mostColor
 */

exports.getUserMostColor = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;

    // // Validation Check (Request Error)
    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 색을 올린 기록이 있는가?
    const mostColorView = await diaryProvider.retrieveUserMostColor(userId);
    // 없다면 디폴트 컬러값 삽입
    if(mostColorView.length < 3){
        const addDefaultColor = await diaryProvider.retrieveNewUserMostColor(userId);
        return res.send(response(baseResponse.SUCCESS, addDefaultColor));
    }
    // 있다면 가장 많이 사용한 컬러값, 그 안에서 최신 작성된 기준으로 조회
    return res.send(response(baseResponse.SUCCESS, mostColorView));
}



/**
 * API No. 11
 * API Name : 홈 컬러 조회 API
 * [GET] /app/diarys/myColor
 */

exports.getMyColor = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;

    // // Validation Check (Request Error)
    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 내 컬러 조회
    const checkMyColor = await diaryProvider.retrieveMyColor(userId);
    return res.send(response(baseResponse.SUCCESS, checkMyColor));
}


/*
    API No. 11
    마이 컬러 등록 및 변경 API
    [POST] /app/diarys/myColor/status
*/

exports.postMyColor = async function(req, res) {
    /*
        Body : color, colorName
    */

    const userId = req.verifiedToken.userId;
    var { color, colorName, myColorId, status } = req.body;

    if (!userId){
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // status 형식 체크
    if (!regStatus.test(status))
        return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));

    // myColorId 값 삭제 api
    if(status === 'N'){
        if (!myColorId){
            return res.send(errResponse(baseResponse.USER_MYCOLORID_EMPTY));
        }

        // myColorId가 내 컬러인지 확인
        const MyColorIdResult = await diaryProvider.myColorIdCheckByMyColorId(myColorId);
        if (!MyColorIdResult[0] != userId) {
            return res.send(errResponse(baseResponse.SIGNUP_MYCOLORID_UNMATCHED));
        }

        // myColorId 범위 조회 --> 존재하는 컬러값인지 확인
        const MaxMyColorId = await diaryProvider.checkMaxMyColorId();
        if (MaxMyColorId[0] < myColorId || myColorId > 0)
            return res.send(errResponse(baseResponse.DIARY_MYCOLORID_NOT_EXIST));


        const withdrawMyColorResult = await diaryService.withdrawMyColor(myColorId);
        return res.send(withdrawMyColorResult);
    }

    else if (!color) {
        return res.send(response(baseResponse.DIARY_COLOR_EMPTY));
    } else if (!colorName) {
        colorName = null
    }


    if(!reghex.test(color)) {
        return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
    }
    if (colorName != null && colorName.length > 100) {
        return res.send(response(baseResponse.DIARY_COLORNAME_LENGTH));
    }


    // myColorId 값을 입력하지 않았을 시, 등록으로 넘어감
    if (!myColorId){
        // 등록할 수 있는 my color 갯수 조회 -->> 총 20개의 myColor값을 가질 수 있음
        const myColorIdRows = await diaryProvider.myColorIdCheck(userId);
        if(myColorIdRows.length !== 0){
            myColorId = myColorIdRows[0].myColorId
            const updateMyColor = await diaryService.editMyColor(myColorId, color, colorName);
            return res.send(updateMyColor);
        }
        else{
            return res.send(errResponse(baseResponse.USER_MYCOLORID_EMPTY_AND_OVERPOSTING));
        }
    }else{

        // myColorId가 내 컬러인지 확인
        const MyColorIdResult = await diaryProvider.myColorIdCheckByMyColorId(myColorId);
        if (!MyColorIdResult[0] != userId) {
            return res.send(errResponse(baseResponse.SIGNUP_MYCOLORID_UNMATCHED));
        }

        // myColorId 범위 조회 --> 존재하는 컬러값인지 확인
        const MaxMyColorId = await diaryProvider.checkMaxMyColorId();
        if (MaxMyColorId[0] < myColorId || myColorId > 0)
            return res.send(errResponse(baseResponse.DIARY_MYCOLORID_NOT_EXIST));

        const updateMyColor = await diaryService.editMyColor(myColorId, color, colorName);
        return res.send(updateMyColor);
    }

};


/*
    API No. 13
    색갈피 끼우기 --> 마이컬러를 이용한 다이어리 등록 API
    [POST] /app/diarys/myColor/diary
*/

exports.postMyColorDiary = async function(req, res) {
    /*
        Body : color, colorName
    */

    const userId = req.verifiedToken.userId;
    const myColorId = req.body.myColorId;

    if (!userId){
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    }
    if (!myColorId){
        return res.send(errResponse(baseResponse.USER_MYCOLORID_EMPTY));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // myColorId가 내 컬러인지 확인
    const MyColorIdResult = await diaryProvider.myColorIdCheckByMyColorId(myColorId);
    if (!MyColorIdResult[0] != userId) {
        return res.send(errResponse(baseResponse.SIGNUP_MYCOLORID_UNMATCHED));
    }

    // myColorId 범위 조회 --> 존재하는 컬러값인지 확인
    const MaxMyColorId = await diaryProvider.checkMaxMyColorId();
    if (MaxMyColorId[0] < myColorId || myColorId > 0)
        return res.send(errResponse(baseResponse.DIARY_MYCOLORID_NOT_EXIST));

    const myColorResult = await diaryProvider.retrieveSelectedMyColor(myColorId);
    const color = myColorResult[0].color
    const colorName = myColorResult[0].colorName

    const TodayResult = await diaryProvider.retrieveTodayDiary(userId);

    // 오늘 입력값이 있다면
    if (TodayResult.length > 0){
        return res.send(response(baseResponse.DIARY_ALREADY_EXIST));
    }
    // color 입력 전
    const signUpResponse = await diaryService.createTodayColor(userId, color, colorName);
    return res.send(signUpResponse);
};


/*
    API No. 17
    마이 컬러 리셋 API
    [PATCH] /app/diarys/myColor/reset
*/
exports.patchMyColorReset = async function (req, res) {
    const userId = req.verifiedToken.userId;

    if(!userId) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    const resetMyColor = await diaryProvider.resetDiaryColor(userId);
    return res.send(response(baseResponse.MYCOLOR_RESET_SUCCESS, resetMyColor));
};



/*
    API No. 11
    홈 마이컬러 등록 API
    [POST] /app/diarys/myColor/status   ... 이전 버전
*/

exports.postHomeColor = async function(req, res) {
    /*
        Body : color, colorName
    */

    const userId = req.verifiedToken.userId;
    var { color, colorName } = req.body;

    if (!userId){
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    }  else if (!color) {
        return res.send(response(baseResponse.DIARY_COLOR_EMPTY));
    } else if (!colorName) {
        colorName = null
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    if(!reghex.test(color)) {
        return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
    }
    if (colorName != null && colorName.length > 100) {
        return res.send(response(baseResponse.AUTH_EMAIL_LENGTH));
    }

    const TodayResult = await diaryProvider.retrieveTodayDiary(userId);

    // 오늘 입력값이 있다면
    if (TodayResult.length > 0){
        const diaryId = TodayResult[0].diaryId
        const updateDiaryColor = await diaryService.editDiaryColor(userId, diaryId, color, colorName);
        return res.send(updateDiaryColor);
    }
    // color 입력 전
    const signUpResponse = await diaryService.createTodayColor(userId, color, colorName);
    return res.send(signUpResponse);
};




/*
    API No. 12
    컬러 변경 API
    [PATCH] /app/diarys/status/color
*/
exports.patchColor = async function (req, res) {
    const userId = req.verifiedToken.userId;
    var {diaryId, color, colorName} = req.body;


    if(!userId) return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    if(!diaryId || diaryId === '') return res.send(errResponse(baseResponse.USER_DIARYID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    const diaryNumLimit = await diaryProvider.getLastDiaryNum();
    if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

    const userDiaryRows = await diaryProvider.diaryIdCheck(diaryId);
    if(userDiaryRows[0].userId != userId) {
        return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
    }

    // 다이어리 존재 >> body값 미 입력시 기존값 유지
    if(!color){
        color = userDiaryRows[0].color
    }

    if(!colorName){
        colorName = userDiaryRows[0].colorName
    }

    // body값 입력시 형식체크
    if(!reghex.test(color)) {
        return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
    }
    if (colorName.length > 100) {
        return res.send(response(baseResponse.AUTH_EMAIL_LENGTH));
    }

    const updateDiaryColor = await diaryService.editDiaryColor(userId, diaryId, color, colorName);
    return res.send(updateDiaryColor);
};

/**
 * API No. 13
 * API Name : 현재 달 감정 기록 조회 API
 * [GET] app/diarys/current-month
 */

exports.getCurrentMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var contentsArr = [];
    var result = [];

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 유저가 작성한 현재 달의 감정기록 불러오기
    const currentMonth = await diaryProvider.retrieveCurrentMonthDiary(userId);


    if(currentMonth.length === 0) return res.send(errResponse(baseResponse.USER_DIARYRECORD_NOT_EXIST));
    for (let i = 0; i < currentMonth.length; i++){
        var contentComponets = []
        const content = currentMonth[i].content
        const recordContent = currentMonth[i].recordContent
        const diaryImgUrl = currentMonth[i].diaryImgUrl
        if(content !== 0){
            contentComponets.push('content')
        }
        if(recordContent !== 0){
            contentComponets.push('recordContent')
        }
        if(diaryImgUrl !== 0){
            contentComponets.push('diaryImgUrl')
        }
        contentsArr[i] = contentComponets
        console.log(contentsArr[i])
    }

    for (let i = 0; i < currentMonth.length; i++){
        result[i] = {
            "currentDiary": {
                "diaryView": currentMonth[i],
                "diaryContents": contentsArr[i]
            }
        }
    }

    return res.send(response(baseResponse.SUCCESS, result));



}

/**
 * API No. 15
 * API Name : 찾으려는 달 감정기록 간단 조회 API
 * [GET] /app/diarys/selected-month:
 */

exports.getSelectedMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var page = req.params.page;
    var contentsArr = [];
    var result = [];

    if (!page)
        page = 0;

    // PAGE 정규표현식
    if(!regPage.test(page)) {
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_ERROR_TYPE));
    }

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 유저가 작성한 현재 달의 감정기록 불러오기
    const selectMonthDiaryResult = await diaryProvider.retrieveBookMarkSelectedMonthDiary(userId, page);
    if(selectMonthDiaryResult.length == 0) res.send(response(baseResponse.USER_DIARYRECORD_NOT_EXIST));
    for (let i = 0; i < selectMonthDiaryResult.length; i++){
        var contentComponets = []
        const content = selectMonthDiaryResult[i].content
        const recordContent = selectMonthDiaryResult[i].recordContent
        const diaryImgUrl = selectMonthDiaryResult[i].diaryImgUrl
        if(content !== 0){
            contentComponets.push('content')
        }
        if(recordContent !== 0){
            contentComponets.push('recordContent')
        }
        if(diaryImgUrl !== 0){
            contentComponets.push('diaryImgUrl')
        }
        contentsArr[i] = contentComponets
        console.log(contentsArr[i])
    }

    for (let i = 0; i < selectMonthDiaryResult.length; i++){
        result[i] = {
            "selectMonthDiary": {
                "diaryView": selectMonthDiaryResult[i],
                "diaryContents": contentsArr[i]
            }
        }
    }

    return res.send(response(baseResponse.SUCCESS, result));

}


/**
 * API No. 15
 * API Name : 찾으려는 달 감정기록 간단 조회 API -- page 입력 없는 버전
 * [GET] /app/diarys/selected-month:
 */

exports.getTargetMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var contentsArr = [];
    var result = [];
    var date = req.query.date

    // 날짜 정규표현식 YYYY-MM
    if(!regDateMonth.test(date)) {
        return res.send(errResponse(baseResponse.SIGNUP_DATE_ERROR_TYPE));
    }

    var d = new Date();
    var now = moment(d)
    date = moment(date)

    console.log(date.diff(now, 'months')); //월 단위로 날짜 차이 계산

    var page = date.diff(now, 'months')

    // PAGE 정규표현식
    if(!regPage.test(page)) {
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_ERROR_TYPE));
    }

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 유저가 작성한 현재 달의 감정기록 불러오기
    const selectMonthDiaryResult = await diaryProvider.retrieveBookMarkSelectedMonthDiary(userId, page);
    console.log(selectMonthDiaryResult)
    if(selectMonthDiaryResult.length == 0) return res.send(response(baseResponse.USER_DIARYRECORD_NOT_EXIST));
    for (let i = 0; i < selectMonthDiaryResult.length; i++){
        var contentComponets = []
        const content = selectMonthDiaryResult[i].content
        const recordContent = selectMonthDiaryResult[i].recordContent
        const diaryImgUrl = selectMonthDiaryResult[i].diaryImgUrl
        if(content !== 0){
            contentComponets.push('content')
        }
        if(recordContent !== 0){
            contentComponets.push('recordContent')
        }
        if(diaryImgUrl !== 0){
            contentComponets.push('diaryImgUrl')
        }
        contentsArr[i] = contentComponets
        console.log(contentsArr[i])
    }

    for (let i = 0; i < selectMonthDiaryResult.length; i++){
        result[i] = {
            "selectMonthDiary": {
                "diaryView": selectMonthDiaryResult[i],
                "diaryContents": contentsArr[i]
            }
        }
    }

    return res.send(response(baseResponse.SUCCESS, result));

}









/**
 * API No. 13
 * API Name : 달 별 감정 기록 조회 API
 * [GET] /app/diarys/calender/month
 */
exports.getMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var page = req.query.page;

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    if (!page)
        page = 0;

    // PAGE 정규표현식
    if(!regPage.test(page)) {
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_ERROR_TYPE));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 유저가 작성한 현재 달의 감정기록 불러오기
    const currentMonthDiaryResult = await diaryProvider.retrieveMonthDiary(userId, page);

    if(currentMonthDiaryResult.length == 0) res.send(response(baseResponse.CALENDER_OUT_OF_RANGE));

    return res.send(response(baseResponse.SUCCESS, currentMonthDiaryResult));
}




/**
 * API No. 14
 * API Name : 특정 다이어리 조회 API
 * [GET] /app/diarys/:diaryId/date
 */

exports.getDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    const diaryId = req.params.diaryId
    var result = [];

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    if(!diaryId)
        return res.send(errResponse(baseResponse.USER_DIARYID_EMPTY));

    if(!regNum.test(diaryId)) {
        return res.send(errResponse(baseResponse.SIGNUP_DIARYID_ERROR_TYPE));
    }

    const diaryNumLimit = await diaryProvider.getLastDiaryNum();
    if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 다이어리 내가 작성 유무 확인
    console.log(diaryId)
    const checkDiaryResult = await diaryProvider.diaryIdCheck(diaryId);
    console.log(checkDiaryResult)
    console.log(checkDiaryResult[0].color)
    if(checkDiaryResult[0].userId != userId) {
        return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
    }
    selectDiaryImgResult = await diaryProvider.retrieveDiaryImg(checkDiaryResult[0].diaryId)
    const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);

    result = {
        "diary": {
            "diaryImage": selectDiaryImgResult,
            "diaryContents": selectDiaryResult[0]
        }
    }
    return res.send(response(baseResponse.DIARY_SELECT_SUCCESS, result));

    //
    // if(content !== 0){
    //     contentComponets.push('content')
    // }
    // var diaryImg = [];
    //
    // selectDiaryImgResult = await diaryProvider.retrieveDiaryImg(diaryId)
    // console.log(selectDiaryImgResult[1].diaryImgUrl)
    // for (let i = 0; i <selectDiaryImgResult.length; i++){
    //     diaryImg[i] = selectDiaryImgResult[i].diaryImgUrl
    // }
    //
    // const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);
    //
    // console.log(diaryImg)
    //
    // result = [diaryImg, selectDiaryResult[0]]
    //     //     "diary": {
    //     //         selectDiaryImgResult,
    //     //         "diaryContents": selectDiaryResult[0]
    //     //     }
    //     // }
    // return res.send(response(baseResponse.DIARY_SELECT_SUCCESS, result));

    // selectDiaryImgResult = await diaryProvider.retrieveDiaryImg(checkDiaryResult[0].diaryId)
//     const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);
//
//     result = {
//         "diary": {
//             "diaryImage": selectDiaryImgResult,
//             "diaryContents": selectDiaryResult[0]
//         }
//     }
//     return res.send(response(baseResponse.DIARY_SELECT_SUCCESS, result));
//
}

/*
    API No. 15
    API Name : 다이어리 등록 API
    [POST] /app/diarys/date
*/

exports.postDiary = async function (req, res){

    /*
    Body :  content, recordContent,color,colorName,date, isManyImg , diaryImgUrl
    */

    const userId = req.verifiedToken.userId;
    var {content, recordContent, color, colorName, date, isManyImg } = req.body;

    if (!date) {
        return res.send(response(baseResponse.USER_DATE_EMPTY));
    }
    // 날짜 정규표현식 YYYY-MM-DD
    if(!regDate.test(date)) {
        return res.send(errResponse(baseResponse.SIGNUP_DATE_ERROR_TYPE));
    }

    const checkDiary = await diaryProvider.diaryDateCheck(userId, date);
    if(checkDiary.length != 0) return res.send(errResponse(baseResponse.DIARY_ALREADY_EXIST));

    if(checkDiary.length === 0) {
        if (!color) {
            return res.send(response(baseResponse.DIARY_COLOR_EMPTY));
        }
        if(!reghex.test(color)) {
            return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
        }
        if (!colorName) {
            colorName = null;
        }
        if (!content) {
            content = null;
        }
        if (!recordContent) {
            recordContent = null;
        }
        if (colorName.length > 100) {
            return res.send(response(baseResponse.DIARY_COLORNAME_LENGTH));
        }

        if (colorName !== null && colorName.length > 100)
            return res.send(response(baseResponse.DIARY_COLORNAME_LENGTH));

        if (content !== null && content.length > 100000)
            return res.send(response(baseResponse.DIARY_CONTENT_LENGTH));

        // 그림을 하나만 업로드 할 경우 혹은 안할 경우
        if (!isManyImg || isManyImg === 'N') {

            var diaryImgUrl = req.body.diaryImgUrl
            isManyImg = 'N'
            if (!diaryImgUrl)
                diaryImgUrl = null;

            else if (diaryImgUrl) {
                const DiaryResult = await diaryService.createDiary(userId, content, recordContent,color,colorName,date, isManyImg );
                const checkDiary = await diaryProvider.userHistoryCheck(userId);
                if(content != null){
                    const isFulledResult = await diaryProvider.editIsFulled(checkDiary[0].diaryId);
                }
                //가장 최근에 만든 게시글에 이미지 파일 업로드
                const diaryId = checkDiary[0].diaryId

                const insertDiaryImgResult = await diaryService.insertDiaryImgUrl(diaryId, diaryImgUrl);

                return res.send(response(baseResponse.DIARY_POSTING_SUCCESS));
            }
        }
        // 그림을 여러개 업로드 할 경우
        else if (isManyImg == 'Y'){

            const diaryImgUrl = req.body.diaryImgUrl
            const insertImgResult = [];

            if (!diaryImgUrl) return res.send(errResponse(baseResponse.DIARY_DIARYIMG_EMPTY));

            const DiaryResult = await diaryService.createDiary(userId, content, recordContent,color,colorName,date, isManyImg );
            const checkDiary = await diaryProvider.userHistoryCheck(userId);
            const diaryId = checkDiary[0].diaryId

            for(let i = 0; i < diaryImgUrl.length; i++){
                insertImgResult[i] = await diaryService.insertDiaryImgUrl(diaryId, diaryImgUrl[i]);
            }

            return res.send(response(baseResponse.DIARY_POSTING_SUCCESS));
        }

        const DiaryResult = await diaryService.createDiary(userId, content, recordContent,color,colorName,date, isManyImg );
        return res.send(response(baseResponse.DIARY_POSTING_SUCCESS));
    }

}

/*
    API No. 16
    API Name : 다이어리 수정 API
    [PATCH] /app/diarys/:diaryId/date
*/
exports.patchDiary = async function(req, res) {
    // Path Variable : articleId
    const userId = req.verifiedToken.userId;
    const diaryId = req.params.diaryId;

    /*
        Body : userId, content, recordContent,color,colorName,date, isManyImg
    */
    var { content, recordContent,color,colorName } = req.body;

    if (!diaryId) {
        return res.send(response(baseResponse.USER_DIARYID_EMPTY));
    }

    if(!regNum.test(diaryId)) {
        return res.send(errResponse(baseResponse.SIGNUP_DIARYID_ERROR_TYPE));
    }

    const diaryNumLimit = await diaryProvider.getLastDiaryNum();
    if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

    const userDiaryRows = await diaryProvider.diaryIdCheck(diaryId);
    // 다이어리 없음
    if(userDiaryRows[0].userId != userId) {
        return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status == 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }
    // 값을 입력하지 않았다면 기존 설정 유지
    const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);

    if (!content) {
        content = selectDiaryResult.content
    }
    if (!recordContent) {
        recordContent = selectDiaryResult.recordContent
    }
    if (!color) {
        color = selectDiaryResult.color
    }
    if (!colorName) {
        colorName = selectDiaryResult.colorName
    }
    // const selectDiaryStatusResult = await diaryProvider.retrieveSelectDiaryStatus(diaryId);
    // if(!isManyImg){
    //     isManyImg = selectDiaryStatusResult.isManyImg
    // }

    const editDiary = await diaryService.editDiary(diaryId, content, recordContent,color,colorName);
    return res.send(editDiary);
};

/*
    API No. 17
    API Name : 다이어리 이미지 수정 API
    [PATCH] /app/diarys/:diaryImgId/image
*/

exports.patchDiaryImg = async function(req, res) {
    // Path Variable : articleId
    const userId = req.verifiedToken.userId;
    const diaryImgId = req.params.diaryImgId;

    /*
        Body : userId, content, recordContent,color,colorName,date, isManyImg
    */
    const diaryImgUrl = req.body.diaryImgUrl;

    if (!diaryImgId) {
        return res.send(response(baseResponse.USER_DIARYIMGID_EMPTY));
    }

    if(!regNum.test(diaryImgId)) {
        return res.send(errResponse(baseResponse.SIGNUP_DIARYIMGID_ERROR_TYPE));
    }

    const diaryImgNumLimit = await diaryProvider.getLastDiaryImgNum();
    console.log(diaryImgNumLimit)
    if(diaryImgId > diaryImgNumLimit || diaryImgId <= 0) return res.send(errResponse(baseResponse.DIARYIMGID_OUT_OF_RANGE));

    const userDiaryImgRows = await diaryProvider.diaryImgIdCheck(diaryImgId);
    // 다이어리 없음
    if(userDiaryImgRows[0].userId != userId) {
        return res.send(errResponse(baseResponse.USER_ID_DIARYIMGID_NOT_MATCH));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status == 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    if (!diaryImgUrl) {
        return res.send(response(baseResponse.DIARY_DIARYIMGURL_EMPTY));
    }

    // const selectDiaryStatusResult = await diaryProvider.retrieveSelectDiaryStatus(diaryId);
    // if(!isManyImg){
    //     isManyImg = selectDiaryStatusResult.isManyImg
    // }

    const editDiaryImg = await diaryService.editDiaryImg(diaryImgId, diaryImgUrl);
    return res.send(editDiaryImg);
};


/*
    API No. 16
    API Name : 통합 다이어리 수정 API --> 삭제 시 value 값으로 iplagkeas
    [PATCH] /app/diarys/editing
*/

exports.patchCombinedDiary = async function(req, res) {
    // Path Variable : articleId
    const userId = req.verifiedToken.userId;

    /*
        Body : userId, content, recordContent,color,colorName,date, isManyImg
    */
    var { diaryId, diaryImgId, content, recordContent,color,colorName} = req.body;


    if (!diaryId) {
        return res.send(response(baseResponse.USER_DIARYID_EMPTY));
    }

    if(!regNum.test(diaryId)) {
        return res.send(errResponse(baseResponse.SIGNUP_DIARYID_ERROR_TYPE));
    }

    // 이미지 값을 변경하지 않겠다는 뜻, 다이어리 자체만 수정해 주면 된다.
    if (!diaryImgId) {

        const diaryNumLimit = await diaryProvider.getLastDiaryNum();
        if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

        const userDiaryRows = await diaryProvider.diaryIdCheck(diaryId);
        // 다이어리 없음
        if(userDiaryRows.length === 0){
            return res.send(errResponse(baseResponse.DIARY_NOT_EXIST));
        }
        if(userDiaryRows[0].userId != userId) {
            return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
        }

        // 탈퇴한 계정인지 체크
        const userStatusRows = await userProvider.retrieveUserStatus(userId);
        if(userStatusRows[0].status == 'D'){
            return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
        }
        // 값을 입력하지 않았다면 기존 설정 유지
        const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);

        if (!content) {
            content = selectDiaryResult[0].content
        }
        if (!recordContent) {
            recordContent = selectDiaryResult[0].recordContent
        }
        if (!color) {
            color = selectDiaryResult[0].color
        }
        if (!colorName) {
            colorName = selectDiaryResult[0].colorName
        }
        if (colorName !== null && colorName.length > 100)
            return res.send(response(baseResponse.DIARY_COLORNAME_LENGTH));

        if (content !== null && content.length > 100000)
            return res.send(response(baseResponse.DIARY_CONTENT_LENGTH));

        const editDiary = await diaryService.editDiary(diaryId, content, recordContent,color,colorName);

        if (content === 'iplagkeas'){
            const DeleteDiaryContent = await diaryProvider.withdrawSelectContent(diaryId);
        }

        if (recordContent === 'iplagkeas'){
            const DeleteRecordDiaryContent = await diaryProvider.withdrawSelectRecordContent(diaryId);
        }

        if (colorName === 'iplagkeas'){
            const DeleteColorName = await diaryProvider.withdrawSelectColorName(diaryId);
        }


        return res.send(editDiary);

        // return res.send(response(baseResponse.USER_DIARYIMGID_EMPTY));
    }
    // 이미지 값을 변경하고 싶을 때는 반드시 diaryImgId 값을 입력받아야 한다.
    else{


        // if(!regNum.test(diaryImgId)) {
        //     return res.send(errResponse(baseResponse.SIGNUP_DIARYIMGID_ERROR_TYPE));
        // }

        // diaryImgId 값 형식 체크
        if (!diaryImgId) {
            return res.send(response(baseResponse.USER_DIARYIMGID_EMPTY));
        }

        for(let i = 0 ; i<diaryImgId.length ; i++){
            if(!regNum.test(diaryImgId[i])) {
                return res.send(errResponse(baseResponse.SIGNUP_DIARYIMGID_ERROR_TYPE));
            }
        }



        const diaryImgUrl = req.body.diaryImgUrl
        const insertImgResult = [];

        if (!diaryImgUrl) {
            return res.send(response(baseResponse.DIARY_DIARYIMGURL_EMPTY));
        }

        // 만약 숫자가 맞지 않는다면, 자동으로 다이어리 삽입으로 넘어가게 설정!
        if (diaryImgUrl.length > diaryImgId.length){
            for(let i = diaryImgId.length; i < diaryImgUrl.length; i++){
                if(diaryImgUrl[i] ==='iplagkeas') return res.send(errResponse(baseResponse.DIARY_DELETE_TARGET_NOT_EXIST));
                insertImgResult[i] = await diaryService.insertDiaryImgUrl(diaryId, diaryImgUrl[i]);
            }
        }

        if (diaryImgUrl.length < diaryImgId.length) return res.send(errResponse(baseResponse.DIARY_IMGARR_UNMATCHED));

        const diaryNumLimit = await diaryProvider.getLastDiaryNum();
        if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

        const diaryImgNumLimit = await diaryProvider.getLastDiaryImgNum();
        for(let i = 0 ; i<diaryImgId.length ; i++){
            if(diaryImgId[i] > diaryImgNumLimit || diaryImgId[i] <= 0) return res.send(errResponse(baseResponse.DIARYIMGID_OUT_OF_RANGE));
        }


        const userDiaryRows = await diaryProvider.diaryIdCheck(diaryId);
        // 다이어리 없음
        if(userDiaryRows.length === 0){
            return res.send(errResponse(baseResponse.DIARY_NOT_EXIST));
        }
        if(userDiaryRows[0].userId != userId) {
            return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
        }

        for(let i = 0 ; i<diaryImgId.length ; i++){
            const userDiaryImgRows = await diaryProvider.diaryImgIdCheck(diaryImgId[i]);
            // 다이어리 없음
            if(userDiaryImgRows.length === 0){
                return res.send(errResponse(baseResponse.USER_DIARYIMG_NOT_EXIST));
            }
            if(userDiaryImgRows[0].userId != userId) {
                return res.send(errResponse(baseResponse.USER_ID_DIARYIMGID_NOT_MATCH));
            }
        }


        // 탈퇴한 계정인지 체크
        const userStatusRows = await userProvider.retrieveUserStatus(userId);
        if(userStatusRows[0].status == 'D'){
            return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
        }

        // 값을 입력하지 않았다면 기존 설정 유지
        const selectDiaryResult = await diaryProvider.retrieveSelectDiary(diaryId);

        if (!content) {
            content = selectDiaryResult[0].content
        }
        if (!recordContent) {
            recordContent = selectDiaryResult[0].recordContent
        }
        if (!color) {
            color = selectDiaryResult[0].color
        }
        if (!colorName) {
            colorName = selectDiaryResult[0].colorName
        }

        if (colorName !== null && colorName.length > 100)
            return res.send(response(baseResponse.DIARY_COLORNAME_LENGTH));

        if (content !== null && content.length > 100000)
            return res.send(response(baseResponse.DIARY_CONTENT_LENGTH));

        const editDiary = await diaryService.editDiary(diaryId, content, recordContent,color,colorName);

        for(let i = 0; i < diaryImgUrl.length; i++){
            insertImgResult[i] = await diaryService.editDiaryImg(diaryImgId[i], diaryImgUrl[i]);
            if(diaryImgUrl[i] === 'iplagkeas'){
                console.log(diaryImgUrl[i])
                insertImgResult[i] = await diaryProvider.withdrawSelectImg(diaryImgId[i]);
            }
        }

        if (content === 'iplagkeas'){
            const DeleteDiaryContent = await diaryProvider.withdrawSelectContent(diaryId);
        }

        if (recordContent === 'iplagkeas'){
            const DeleteRecordDiaryContent = await diaryProvider.withdrawSelectRecordContent(diaryId);
        }

        if (colorName === 'iplagkeas'){
            const DeleteColorName = await diaryProvider.withdrawSelectColorName(diaryId);
        }

        // const selectDiaryStatusResult = await diaryProvider.retrieveSelectDiaryStatus(diaryId);
        // if(!isManyImg){
        //     isManyImg = selectDiaryStatusResult.isManyImg
        // }
        return res.send(editDiary);
    }

};

/*
    API No. 17
    API Name : 다이어리 삭제 API
    [PATCH] /app/diarys/withdrawal/:diaryId
*/

exports.withdrawDiary = async function(req, res) {
    // Path Variable : articleId
    const userId = req.verifiedToken.userId;
    const diaryId = req.params.diaryId;

    if (!diaryId) {
        return res.send(response(baseResponse.USER_DIARYID_EMPTY));
    }

    if(!regNum.test(diaryId)) {
        return res.send(errResponse(baseResponse.SIGNUP_DIARYID_ERROR_TYPE));
    }

    const diaryNumLimit = await diaryProvider.getLastDiaryNum();
    if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

    const userDiaryRows = await diaryProvider.diaryIdCheck(diaryId);
    // 다이어리 없음
    if(userDiaryRows.length === 0){
        return res.send(errResponse(baseResponse.DIARY_NOT_EXIST));
    }
    if(userDiaryRows[0].userId != userId) {
        return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status == 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    const withdrawDiary = await diaryService.withdrawDiary(diaryId);
    return res.send(withdrawDiary);
};





// // 그림을 하나만 업로드 할 경우 혹은 안할 경우
// if (!isManyImg || isManyImg == 'N') {
//
//     var diaryImgUrl = req.body.diaryImgUrl
//     if (!diaryImgUrl)
//         diaryImgUrl = null;
//     else {
//         const DiaryResult = await diaryService.createDiary(userId, content, recordContent,color,colorName,date, isManyImg );
//         const checkDiary = await diaryProvider.userHistoryCheck(userId);
//         if(content != null){
//             const isFulledResult = await diaryProvider.editIsFulled(checkDiary[0].diaryId);
//         }
//         //가장 최근에 만든 게시글에 이미지 파일 업로드
//         const diaryId = checkDiary[0].diaryId
//
//         const insertDiaryImgResult = await diaryService.insertDiaryImgUrl(diaryId, diaryImgUrl);
//
//         return res.send(response(baseResponse.DIARY_POSTING_SUCCESS));
//     }
// }
// // 그림을 여러개 업로드 할 경우
// else if (isManyImg == 'Y'){
//     const diaryImgUrl = req.body.diaryImgUrl
//     console.log(diaryImgUrl.length)
//     const insertImgResult = [];
//
//     if (!diaryImgUrl) return res.send(errResponse(baseResponse.DIARY_DIARYIMG_EMPTY));
//
//     const DiaryResult = await diaryService.createDiary(userId, content, recordContent,color,colorName,date, isManyImg );
//     const checkDiary = await diaryProvider.userHistoryCheck(userId);
//     const diaryId = checkDiary[0].diaryId
//
//     for(let i = 0; i < diaryImgUrl.length; i++){
//         insertImgResult[i] = await diaryService.insertDiaryImgUrl(diaryId, diaryImgUrl[i]);
//     }
//
//     return res.send(response(baseResponse.DIARY_POSTING_SUCCESS));
// }