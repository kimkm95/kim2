const {logger} = require("../../../config/winston");
const {pool} = require("../../../config/database");
const secret_config = require("../../../config/secret");
const baseResponse = require("../../../config/baseResponseStatus");
const {response} = require("../../../config/response");
const {errResponse} = require("../../../config/response");
const diaryProvider = require("./diaryProvider");
const diaryDao = require("./diaryDao");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {connect} = require("http2");

// Service: Create, Update, Delete 비즈니스 로직


// 홈 컬러 생성
exports.createTodayColor = async function(userId, color, colorName) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const insertHomeColorResult = await diaryDao.insertTodayColor(connection, userId, color, colorName);
        connection.release();

        return response(baseResponse.HOME_COLOR_POSTING_SUCCESS);
    } catch (err) {
        logger.error(`App - homeColor Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

// 다이어리 생성
exports.createDiary = async function(userId, content, recordContent,color,colorName,date, isManyImg ) {
    try {
        const insertDiaryInfoParams = [userId, content, recordContent,color,colorName,date, isManyImg ];

        const connection = await pool.getConnection(async (conn) => conn);
        const diaryResult = await diaryDao.insertDiaryInfo(connection, insertDiaryInfoParams);
        console.log(`추가된 다이어리 : ${diaryResult[0]}`)
        connection.release();


        return response(baseResponse.DIARY_POSTING_SUCCESS);
    } catch (err) {
        logger.error(`App - Diary Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


// 다이어리 이미지 생성
exports.insertDiaryImgUrl = async function (diaryId, diaryImgUrl) {
    try {
        const insertDiaryImgParams = [diaryId, diaryImgUrl];
        const connection = await pool.getConnection(async (conn) => conn);
        const insertDiaryImgResult = await diaryDao.insertDiaryImgUrl(connection, insertDiaryImgParams);
        console.log(`추가된 사진`)
        connection.release();
        return response(baseResponse.USER_COLOR_UPDATE_SUCCESS, insertDiaryImgResult.info);
    } catch(err) {
        logger.error(`App - insertImgDiary Service Error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};



exports.editHomeColor = async function (userId, dateId) {
    try {
        const selectHomeColorRows = await productProvider.dateColor(dateId);
        if(selectHomeColorRows.length === 0) return errResponse(baseResponse.PRODUCT_NOT_EXIST);

        const connection = await pool.getConnection(async (conn) => conn);
        const updateHomeColor = await productDao.updateHomeColor(connection, userId, dateId);
        connection.release();

        return response(baseResponse.PRODUCT_STATUS_UPDATE_SUCCESS, updateProductStatus[0].info);

    } catch (err) {
        logger.error(`App - editProductStatus Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.editDiaryColor = async function (userId, diaryId, color, colorName) {
    try {

        const connection = await pool.getConnection(async (conn) => conn);
        const editUserColorResult = await diaryDao.updateDiaryColor(connection, diaryId, color, colorName);
        connection.release();

        return response(baseResponse.USER_COLOR_UPDATE_SUCCESS, editUserColorResult.info);
    } catch (err){
        logger.error(`App - editDiaryColor Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}


exports.editMyColor = async function (myColorId, color, colorName) {
    try {

        const connection = await pool.getConnection(async (conn) => conn);
        const editUserMyColorResult = await diaryDao.updateMyColor(connection, myColorId, color, colorName);
        connection.release();

        return response(baseResponse.USER_COLOR_UPDATE_SUCCESS, editUserMyColorResult.info);
    } catch (err){
        logger.error(`App - editMyColor Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}


exports.editDiary = async function (diaryId, content, recordContent,color,colorName) {
    try {

        const connection = await pool.getConnection(async (conn) => conn);
        const updateDiaryResult = await diaryDao.updateDiary(connection, diaryId, content, recordContent,color,colorName);
        connection.release();

        return response(baseResponse.DIARY_UPDATE_SUCCESS, updateDiaryResult[0].info);
    } catch (err) {
        logger.error(`App - patchArticle Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.editDiaryImg = async function (diaryImgId, diaryImgUrl) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const updateDiaryImgResult = await diaryDao.updateDiaryImg(connection, diaryImgId, diaryImgUrl);
        connection.release();

        return response(baseResponse.DIARYIMG_UPDATE_SUCCESS, updateDiaryImgResult[0].info);
    } catch (err) {
        logger.error(`App - patchDiaryImg Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.withdrawMyColor = async function (myColorId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const withdrawMyColorResult = await diaryDao.withdrawMyColor(connection, myColorId);
        connection.release();

        return response(baseResponse.MYCOLOR_WITHDRAW_SUCCESS, withdrawMyColorResult[0].info);
    } catch (err) {
        logger.error(`App - withdrawMyColor Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


exports.withdrawDiary = async function (diaryId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const withdrawImgResult = await diaryDao.withdrawDiaryImg(connection, diaryId);
        const withdrawResult = await diaryDao.withdrawDiary(connection, diaryId);
        connection.release();

        return response(baseResponse.MYDIARY_WITHDRAW_SUCCESS);
    } catch (err) {
        logger.error(`App - withdrawDiary Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};










// update LikeFlag Status
exports.updateLikeFlagStatus = async function (reviewIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateResult = await productDao.updateLikeFlagStatus(connection, [reviewIdx, userIdx]);

    connection.release();

    return updateResult;
}

// update LikeFlag
exports.updateLikeFlag = async function (reviewIdx, userIdx, status) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateResult = await productDao.updateLikeFlag(connection, [reviewIdx, userIdx, status]);

    connection.release();

    return updateResult;
}


// Insert Like
exports.insertLike = async function (productIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const insertResult = await productDao.insertLike(connection, [productIdx, userIdx]);
    connection.release();

    return insertResult;
}

// update Like
exports.updateLike = async function (productIdx, userIdx, status) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateResult = await productDao.updateLike(connection, [productIdx, userIdx, status]);

    connection.release();

    return updateResult;
}

// Insert Store Bookemark
exports.insertStore = async function (storeIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const insertResult = await productDao.insertStore(connection, [storeIdx, userIdx]);
    connection.release();

    return insertResult;
}

// update Store Bookmark
exports.updateStore = async function (storeIdx, userIdx, status) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateResult = await productDao.updateStore(connection, [storeIdx, userIdx, status]);

    connection.release();

    return updateResult;
}

// Insert Brand Bookemark
exports.insertBrand = async function (brandIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const insertResult = await productDao.insertBrand(connection, [brandIdx, userIdx]);
    connection.release();

    return insertResult;
}

// update Brand Bookmark
exports.updateBrand = async function (brandIdx, userIdx, status) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateResult = await productDao.updateBrand(connection, [brandIdx, userIdx, status]);

    connection.release();

    return updateResult;
}

// Insert Brand Coupon
exports.brandCoupon= async function (couponIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const insertResult = await productDao.insertBrandCoupon(connection, [couponIdx, userIdx]);
    connection.release();

    return insertResult;
}

// Insert Product Coupon
exports.productCoupon= async function (couponIdx, userIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const insertResult = await productDao.insertProductCoupon(connection, [couponIdx, userIdx]);
    connection.release();

    return insertResult;
}