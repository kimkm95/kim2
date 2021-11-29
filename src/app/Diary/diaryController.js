const jwtMiddleware = require("../../../config/jwtMiddleware");
const diaryProvider = require("../../app/Diary/diaryProvider");
const userProvider = require("../../app/User/userProvider");
const diaryService = require("../../app/Diary/diaryService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");

const {emit} = require("nodemon");
const { SUCCESS } = require("../../../config/baseResponseStatus");

// regex
const regPage = /^[0-9]/g;
const regSize = /^[0-9]/g;
const regNum = /^[0-9]/g;
const regPassword = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,16}/;
const regexEmail = require("regex-email");
const regPhoneNumber = /^\d{3}\d{3,4}\d{4}$/;
var reghex = /^#(?:[0-9a-f]{3}){1,2}$/i;
var regDate = /^(19|20)\d{2}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[0-1])$/;
var regDateMonth = /^(19|20)\d{2}-(0[1-9]|1[012])$/;

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

/*
    API No. 11
    홈 컬러 등록 API
    [POST] /app/diarys/home
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
        return res.send(response(baseResponse.DIARY_COLORNAME_EMPTY));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    if(!reghex.test(color)) {
        return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
    }
    if (colorName.length > 100) {
        return res.send(response(baseResponse.AUTH_EMAIL_LENGTH));
    }

    const TodayResult = await diaryProvider.retrieveTodayDiary(userId);
    console.log(TodayResult.length)

    // 오늘 입력값이 있다면
    if (TodayResult.length > 0)
        return res.send(response(baseResponse.HOME_COLOR_ALREADY_DONE, TodayResult[0]));
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
    console.log(userDiaryRows[0].color)
    if(!colorName){
        colorName = userDiaryRows[0].colorName
    }
    console.log(userDiaryRows[0].colorName)

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
 * API Name : 현재 달 감정 기록 조회 API  >> 사진 조회 기능 추 후에 추가
 * [GET] app/diarys/current-month
 */

exports.getCurrentMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 유저가 작성한 현재 달의 감정기록 불러오기
    const currentMonth = await diaryProvider.retrieveCurrentMonthDiary(userId);
    return res.send(response(baseResponse.SUCCESS, currentMonth));

}

// /**
//  * API No. 15
//  * API Name : 찾으려는 달 감정기록 간단 조회 API
//  * [GET] app/diarys/selected-month
//  */
//
// exports.getSelectedMonthDiary = async function (req, res) {
//
//     // Request Token
//     const userId = req.verifiedToken.userId;
//     var {date} = req.body;
//     var result = [];
//
//     if (!userId)
//         return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
//     if(!date)
//         return res.send(errResponse(baseResponse.USER_DIARYID_EMPTY));
//
//     // 날짜 정규표현식 월까지만 YYYY-MM
//     if(!regDateMonth.test(date)) {
//         return res.send(errResponse(baseResponse.SIGNUP_DATE_ERROR_TYPE));
//     }
//     console.log(date)
//
//     // const diaryNumLimit = await diaryProvider.getLastDiaryNum();
//     // if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));
//
//     // 탈퇴한 계정인지 체크
//     const userStatusRows = await userProvider.retrieveUserStatus(userId);
//     if(userStatusRows[0].status === 'D'){
//         return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
//     }
//
//     // 다이어리 존재 여부 확인
//     const checkDiaryResult = await diaryProvider.diaryIdCheck(diaryId);
//     if(checkDiaryResult[0].userId != userId) {
//         return res.send(errResponse(baseResponse.USER_ID_DIARYID_NOT_MATCH));
//     }
//
//     selectDiaryImgResult = await diaryProvider.retrieveDiaryImg(checkDiaryResult[0].diaryId)
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
// }
//
//
//
//     // 유저가 작성한 특정 달의 감정기록 불러오기
//     const selectedMonth = await diaryProvider.retrieveSelectedMonthDiary(userId,month);
//     return res.send(response(baseResponse.SUCCESS, currentMonth));
//
// }



/**
 * API No. 13
 * API Name : 달 별 감정 기록 조회 API
 * [GET] /app/diarys/month/:page
 */
exports.getMonthDiary = async function (req, res) {

    // Request Token
    const userId = req.verifiedToken.userId;
    var page = req.query.page;

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    if (!page)
        page = 0;

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
    var selectDiaryImgResult = [];
    var result = [];

    if (!userId)
        return res.send(errResponse(baseResponse.USER_USERID_EMPTY));
    if(!diaryId)
        return res.send(errResponse(baseResponse.USER_DIARYID_EMPTY));

    const diaryNumLimit = await diaryProvider.getLastDiaryNum();
    if(diaryId > diaryNumLimit || diaryId <= 0) return res.send(errResponse(baseResponse.DIARYID_OUT_OF_RANGE));

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === 'D'){
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));
    }

    // 다이어리 존재 여부 확인
    const checkDiaryResult = await diaryProvider.diaryIdCheck(diaryId);
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
    var {content, recordContent,color,colorName,date, isManyImg } = req.body;

    if (!date) {
        return res.send(response(baseResponse.USER_DATE_EMPTY));
    }
    // 날짜 정규표현식 YYYY-MM-DD
    if(!regDate.test(date)) {
        return res.send(errResponse(baseResponse.SIGNUP_DATE_ERROR_TYPE));
    }

    const checkDiary = await diaryProvider.diaryDateCheck(userId, date);
    console.log(checkDiary)
    if(checkDiary.length != 0) return res.send(errResponse(baseResponse.DIARY_ALREADY_EXIST));

    if(checkDiary.length === 0) {
        if (!color) {
            return res.send(response(baseResponse.DIARY_COLOR_EMPTY));
        }
        if(!reghex.test(color)) {
            return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
        }
        if (!colorName) {
            return res.send(response(baseResponse.DIARY_COLORNAME_EMPTY));
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

        if(!reghex.test(color)) {
            return res.send(errResponse(baseResponse.SIGNIN_COLOR_ERROR_TYPE));
        }

        // 그림을 하나만 업로드 할 경우 혹은 안할 경우
        if (!isManyImg || isManyImg === 'N') {

            var diaryImgUrl = req.body.diaryImgUrl
            isManyImg = 'N'
            console.log(isManyImg)
            if (!diaryImgUrl)
                diaryImgUrl = null;

            else if (diaryImgUrl) {
                console.log(isManyImg)
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