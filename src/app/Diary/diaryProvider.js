const { response } = require("express");
const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");
const {errResponse} = require("../../../config/response");
const diaryDao = require("./diaryDao");
const baseResponse = require("../../../config/baseResponseStatus");

// User Check
exports.userCheck = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userCheckResult = await diaryDao.selectUserId(connection, userId);
    connection.release();

    return userCheckResult;
};

// 유저 전체 다이어리 기록 조회    diaryId,color,colorName,date
exports.userHistoryCheck = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userHistoryCheckResult = await diaryDao.selectUserHistory(connection, userId);
    connection.release();

    return userHistoryCheckResult;
};



// diaryId Check      diaryId,color,colorName,userId
exports.diaryIdCheck = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const diaryIdCheckResult = await diaryDao.selectDiaryId(connection, diaryId);
    connection.release();

    return diaryIdCheckResult;
};

// 다이어리를 날자를 이용하여 조회      userId,diaryId,color,colorName,nickname
exports.diaryDateCheck = async function (userId, date) {
    const connection = await pool.getConnection(async (conn) => conn);
    const diaryDateCheckResult = await diaryDao.selectDiaryDate(connection,userId, date);
    connection.release();

    return diaryDateCheckResult;
};

// 다이어리 이미지 인덱스값 조회     diaryId,diaryImgUrl,userId
exports.diaryImgIdCheck = async function (diaryImgId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const diaryImgIdCheckResult = await diaryDao.selectDiaryImgId(connection, diaryImgId);
    connection.release();

    return diaryImgIdCheckResult;
};

//
exports.myColorIdCheck = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myColorIdCheckResult = await diaryDao.selectMyColorIdCheck(connection, userId);
    connection.release();

    return myColorIdCheckResult;
};

// userId 값을 myColorId로 찾기
exports.myColorIdCheckByMyColorId = async function (myColorId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myColorIdCheckResult = await diaryDao.selectMyColorIdCheckByMyColorId(connection, myColorId);
    connection.release();

    return myColorIdCheckResult;
};


exports.checkMaxMyColorId = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    const myColorIdCheckResult = await diaryDao.selectCheckMaxMyColorId(connection);
    connection.release();

    return myColorIdCheckResult;
};




// 다이어리 이미지 결과물 찾기      diaryImgUrl
exports.retrieveDiaryImg = async function(diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectDiaryImgResult = diaryDao.selectDiaryImg(connection, diaryId);
    connection.release();

    return selectDiaryImgResult;
};


// // Get Home Diary     color, colorName, nickname
// exports.retrieveHomeDiary = async function (userId, date) {
//     const connection = await pool.getConnection(async (conn) => conn);
//     const homeDiaryResult = await diaryDao.selectHomeDiary(connection,userId);
//
//     connection.release();
//
//     return homeDiaryResult;
// };

// Get Today Diary      diaryId,color,colorName,nickname
exports.retrieveTodayDiary = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const TodayDiaryResult = await diaryDao.selectTodayDiary(connection,userId);

    connection.release();

    return TodayDiaryResult;
};

exports.retrieveBasicColor = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    const BasicColorResult = await diaryDao.selectBasicColor(connection);

    connection.release();

    return BasicColorResult;
};


exports.retrieveMyColor = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myColorResult = await diaryDao.selectMyColor(connection, userId);
    connection.release();
    return myColorResult;
};


exports.retrieveUserMostColor = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myMostColorResult = await diaryDao.selectMyMostColor(connection, userId);
    connection.release();
    return myMostColorResult;
};

// 3가지 색상을 사용한 적이 없는 유저에게 기본 컬러를 추가해서 3개 색상을 보여줌
exports.retrieveNewUserMostColor = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myMostColorResult = await diaryDao.selectNewMyMostColor(connection, userId);
    connection.release();
    return myMostColorResult;
};


exports.retrieveSelectedMyColor = async function (myColorId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const myColorResult = await diaryDao.selectMyColorId(connection, myColorId);
    connection.release();
    return myColorResult;
};

// 가장 많이 사용한 컬러값을 기준으로 최신화
exports.retrieveUserColor = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const HomeColorResult = await diaryDao.selectHomeColorView(connection,userId);
    connection.release();

    return HomeColorResult;
};



// Get Current Month Diary      diaryId,color,colorName,nickname
exports.retrieveCurrentMonthDiary = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const CurrentMonthDiaryResult = await diaryDao.selectCurrentMonthDiary(connection,userId);

    connection.release();

    return CurrentMonthDiaryResult;
};

// get BookMark Month diary
exports.retrieveBookMarkSelectedMonthDiary = async function (userId, page) {
    const connection = await pool.getConnection(async (conn) => conn);
    const SelectedMonthDiaryResult = await diaryDao.selectBookMarkMonthDiary(connection,userId,page);

    connection.release();

    return SelectedMonthDiaryResult;
};

// get BookMark Month diary
exports.retrieveBookMarkTargetMonthDiary = async function (userId, date) {
    const connection = await pool.getConnection(async (conn) => conn);
    const SelectedMonthDiaryResult = await diaryDao.selectBookMarkTargetMonthDiary(connection,userId,date);
    connection.release();

    return SelectedMonthDiaryResult;
};



// Get Current Month Diary      diaryId,color,colorName,nickname
exports.retrieveSelectedMonthDiary = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const CurrentMonthDiaryResult = await diaryDao.selectCurrentMonthDiary(connection,userId);

    connection.release();

    return CurrentMonthDiaryResult;
};



exports.retrieveMonthDiary = async function (userId, page) {
    const connection = await pool.getConnection(async (conn) => conn);
    const MonthDiaryResult = await diaryDao.selectMonthDiary(connection,userId, page);

    connection.release();

    return MonthDiaryResult;
};



// Get selected Diary      diaryId, color, colorName, nickname, content, recordContent, date as 'date'
exports.retrieveSelectDiary = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectDiaryResult = await diaryDao.selectDiary(connection,diaryId);

    connection.release();

    return selectDiaryResult;
};

exports.retrieveSelectDiaryStatus = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectDiaryStatusResult = await diaryDao.selectDiaryStatus(connection,diaryId);

    connection.release();

    return selectDiaryStatusResult;
};



exports.editIsFulled = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const isFulledResult = await diaryDao.updateIsFulled(connection,diaryId);

    connection.release();

    return isFulledResult;
};


exports.withdrawSelectContent = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const withdrawSelectContentResult = await diaryDao.withdrawSelectContent(connection,diaryId);
    connection.release();

    return withdrawSelectContentResult;
};

exports.withdrawSelectRecordContent = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const withdrawSelectContentResult = await diaryDao.withdrawSelectRecordContent(connection,diaryId);
    connection.release();

    return withdrawSelectContentResult;
};


exports.withdrawSelectColorName = async function (diaryId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const withdrawSelectContentResult = await diaryDao.withdrawSelectColorName(connection,diaryId);
    connection.release();

    return withdrawSelectContentResult;
};


exports.withdrawSelectImg = async function (diaryImgId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const withdrawSelectContentResult = await diaryDao.withdrawSelectImg(connection,diaryImgId);
    connection.release();

    return withdrawSelectContentResult;
};



// Get Home Slide Monthly Diary
exports.homeSlideProduct = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    const homeSlideProductResult = await diaryDao.selectHomeSlideProduct(connection);

    connection.release();

    return homeSlideProductResult;
};

// Get Month Diary
exports.monthlyDiary = async function (userId, month) {
    const connection = await pool.getConnection(async (conn) => conn);
    const monthlyDiaryResult = await diaryDao.selectMonthlyDiary(connection, userId, month);

    connection.release();

    return monthlyDiaryResult;
};

// Get DateColor
exports.getDateColor = async function (userId,date) {
    const connection = await pool.getConnection(async (conn) => conn);
    const dateIdResult = await diaryDao.dateCheck(connection,userId,date);

    connection.release();

    return dateIdResult;
};

// 마지막 다이어리 인덱스 번호 추출
exports.getLastDiaryNum = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    const dateIdResult = await diaryDao.lastDiaryColumCheck(connection);

    connection.release();

    return dateIdResult[0].diaryId;
};

exports.getLastDiaryImgNum = async function () {
    const connection = await pool.getConnection(async (conn) => conn);
    const dateIdResult = await diaryDao.lastDiaryImgColumCheck(connection);
    connection.release();

    return dateIdResult[0].diaryImgId;
};




// Get Date Color
exports.dateColor = async function (dateId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const dateColorResult = await diaryDao.selectDateColor(connection, dateId);

    connection.release();

    return dateColorResult;
};


// Get Most Color in month
exports.monthColorRank = async function (dateId, month) {
    const connection = await pool.getConnection(async (conn) => conn);
    const monthColorRankResult = await diaryDao.MonthColorRankResult(connection, dateId, month);

    connection.release();

    return monthColorRankResult;
};


// Get Color Name
exports.colorName = async function (dateId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const colorName = await diaryDao.selectColorName(connection,dateId);

    connection.release();

    return colorName;
};

exports.resetDiaryColor = async function (userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const deleteMyColorResult = await diaryDao.deleteMyColor(connection,userId);
    const resetmyColorResult = await diaryDao.resetMyColor(connection,userId);
    connection.release();

    return resetmyColorResult[0].info;
};



