const {logger} = require("../../../config/winston");
const {pool} = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userProvider = require("./userProvider");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const {response} = require("../../../config/response");
const {errResponse} = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {connect} = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리


////// create - 새롭게 생성

// 유저 생성
exports.createUser = async function (email, password, nickname) {
    try {
        // 이메일 중복 확인
        const emailRows = await userProvider.emailCheck(email);
        if (emailRows.length > 0) {

            if (emailRows[0].status == 'D') {
                const userId = emailRows[0].userId
                const connection = await pool.getConnection(async (conn) => conn);
                const updateUserStatusResult = await userDao.updateUser(connection, userId);
                connection.release();

                return response(baseResponse.USER_COMBACK_SUCCESS, updateUserStatusResult.info);
            }
            return errResponse(baseResponse.SIGNUP_REDUNDANT_EMAIL);
        }

        // 비밀번호 암호화
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const insertUserInfoParams = [email, hashedPassword, nickname];

        const connection = await pool.getConnection(async (conn) => conn);

        const userIdResult = await userDao.insertUserInfo(connection, insertUserInfoParams);
        console.log(`추가된 회원 : ${userIdResult[0].insertId}`)
        var userId = userIdResult[0].insertId
        console.log(userId)
        const insertUserColorResult = await userDao.insertUserColor(connection);
        const updateIniUserColorResult = await userDao.updateIniUserColor(connection, userId);
        connection.release();


        return response(baseResponse.SUCCESS);


    } catch (err) {
        logger.error(`App - createUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


// 미니코드 추가
exports.updateMiniCode = async function (userId, miniCode) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const MiniCodeResult = await userDao.updateMiniCodeInfo(connection, userId, miniCode)
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - updateMiniCode Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}


exports.createSocialUser = async function (email, name) {
    try {
        const password = 'temporary'
        console.log(password)

        // 비밀번호 암호화
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        console.log(hashedPassword)

        const insertUserInfoParams = [email, hashedPassword, name];

        const connection = await pool.getConnection(async (conn) => conn);
        const userIdResult = await userDao.insertSocialUser(connection, insertUserInfoParams);
        connection.release();

        return response(baseResponse.USER_KAKAO_SIGNUP_SUCCESS, {"addedUser": userIdResult[0].insertId});

    } catch (err) {
        logger.error(`App - createSocialUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


////// 로그인


// API No. 10 로그인 + JWT 발급 API
exports.postSignIn = async function (email, password) {
    try {
        // 이메일 존재 여부 확인
        const emailRows = await userProvider.emailCheck(email);
        if (emailRows.length < 1) return errResponse(baseResponse.SIGNIN_EMAIL_WRONG);

        const selectEmail = emailRows[0].email
        const selectNickname = emailRows[0].nickname

        // 비밀번호 확인
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const selectUserPasswordParams = [selectEmail, hashedPassword];
        const passwordRows = await userProvider.passwordCheck(selectUserPasswordParams);
        console.log(passwordRows[0].password)
        console.log(hashedPassword)

        if (passwordRows[0].password !== hashedPassword) {
            return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
        }

        // 계정 상태 확인 (탈퇴된 계정인지 아닌지 확인)
        const userInfoRows = await userProvider.emailCheck(email);
        console.log(userInfoRows)
        if (userInfoRows[0].status === 'D') {
            return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);
        }

        // // 로그인 여부 check
        // const checkJWT = await userProvider.checkJWT(emailRows[0].userId);
        // if (checkJWT.length > 0) {
        //     return errResponse(baseResponse.ALREADY_LOGIN);
        // }

        //토큰 생성 Service
        let token = await jwt.sign(
            {
                userId: userInfoRows[0].userId,
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "userTB",
            } // 유효 기간 365일
        );

        // 토큰 값 넣어주기
        // const connection = await pool.getConnection(async (conn) => conn);
        // const tokenResult = await userDao.insertToken(connection, emailRows[0].userId, token);
        // connection.release();

        return response(baseResponse.SUCCESS, {'userId': userInfoRows[0].userId, 'nickname' : selectNickname, 'jwt': token});

    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


exports.postSocialSignIn = async function (email) {
    try {

        // 계정 상태 확인 (탈퇴된 계정인지 아닌지 확인)
        const userInfoRows = await userProvider.emailCheck(email);

        if (userInfoRows[0].status === 'D') {
            return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);
        }

        //토큰 생성 Service
        let token = await jwt.sign(
            {
                userId: userInfoRows[0].userId,
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "userTB",
            } // 유효 기간 365일
        );
        console.log(token)

        return response(baseResponse.USER_KAKAO_SIGNIN_SUCCESS, {'userId': userInfoRows[0].userId, 'jwt': token});

    } catch (err) {
        logger.error(`App - postSocialSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};



exports.deleteJWT = async function(userId) {
    try {
        const connection = await pool.getConnection(async(conn) => conn);
        const deleteJWTResult = await userDao.deleteJWT(connection, userId);
        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - deleteJWT Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


// 유저 상태 변경
exports.editUserStatus = async function (userId, alarmStatus, miniCodeStatus, NameStatus, BGMStatus) {
    try {
        const userStatusRows = await userProvider.retrieveUserStatus(userId);
        const connection = await pool.getConnection(async (conn) => conn);
        const updateUserStatusResult = await userDao.updateUserStatus(connection, userId, alarmStatus, miniCodeStatus, NameStatus, BGMStatus);
        connection.release();

        return response(baseResponse.USER_STATUS_UPDATE_SUCCESS, updateUserStatusResult.info);


    } catch (err) {
        logger.error(`App - editUserStatus Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

// 소셜 유저 토큰 변경
exports.editUserSocialToken = async function (userId, token) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const UserSocialToken = await userDao.updateSocialUserToken(connection, userId, token);
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - editUserSocialToken Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


exports.withdrawUser = async function (userId) {
    try {

        const connection = await pool.getConnection(async (conn) => conn);
        const deleteUserStatusResult = await userDao.deleteUserStatus(connection, userId);
        connection.release();

        return response(baseResponse.USER_DELETE_SUCCESS, deleteUserStatusResult.info);

    } catch (err) {
        logger.error(`App - deleteUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};



exports.editUserNickname = async function (userId, nickname) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const updateUserNicknameResult = await userDao.updateUserNickname(connection, userId, nickname)
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - editUserNickname Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}



// Patch Password
exports.patchPassword = async function (hashedPassword, email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updatePasswordResult = await userDao.updatePassword(connection, [hashedPassword, email]);

    connection.release();

    return updatePasswordResult;
}

// Patch Password
exports.patchPasswordByUserId = async function (hashedPassword, userId) {
    const connection = await pool.getConnection(async (conn) => conn);
    const updatePasswordResult = await userDao.updatePasswordByUserId(connection, [hashedPassword, userId]);

    connection.release();

    return updatePasswordResult;
}