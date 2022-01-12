const {logger} = require("../../../config/winston");
const {pool} = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userProvider = require("./userProvider");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const {response} = require("../../../config/response");
const {errResponse} = require("../../../config/response");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const qs = require("querystring");
const appleLogin = require('../../app/lib/appleLoginIn');
const AppleStrategy = require('passport-apple');
const jwt_decode = require("jwt-decode");

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

exports.createAppleUser = async function (email, nickname, sub) {

    try {
        const connection = await pool.getConnection(async (conn) => conn);
        // 이메일 중복 확인
        const emailRows = await userProvider.emailCheck(email);
        // 새롭게 생성하는 것이기 때문에 기존에 존재하면 안됌
        if (emailRows.length > 0)
            return errResponse(baseResponse.SIGNUP_REDUNDANT_EMAIL);

        // 비밀번호 생성
        const password = 'temporary'
        console.log(password)

        // 비밀번호 암호화
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const insertUserInfoParams = [email,hashedPassword, nickname,sub, 2];


        const userIdResult = await userDao.insertAppleUserInfo(connection, insertUserInfoParams);
        console.log(`추가된 회원 : ${userIdResult[0].insertId}`);
        var userId = userIdResult[0].insertId
        console.log(userId)
        const insertUserColorResult = await userDao.insertUserColor(connection);
        const updateIniUserColorResult = await userDao.updateIniUserColor(connection, userId);
        // 계정 상태 확인
        // const userInfoRows = await userProvider.emailCheck(email);
        //
        // console.log(userInfoRows) ;// DB의 userId
        // console.log(userInfoRows.userId); // DB의 userId

        //토큰 생성 Service
        // let token = await jwt.sign(
        //     {
        //         userId: userInfoRows[0].userId,
        //     }, // 토큰의 내용(payload)
        //     secret_config.jwtsecret, // 비밀키
        //     {
        //         expiresIn: "365d",
        //         subject: "userInfo",
        //     } // 유효 기간 365일
        // );

        connection.release();
        // return response(baseResponse.SUCCESS,{'userId': userInfoRows[0].userId, 'jwt': token});
        return userIdResult

    } catch (err) {

        logger.error(`App - createAppleUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};
const signWithApplePrivateKey = process.env.APPLE_SCRET_KEY="-----BEGIN PRIVATE KEY-----\n" +
    "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEhdLNG1LoKY9ISc9\n" +
    "ptoAJtOi5i4SLkkp9EqraZ3/5ZGgCgYIKoZIzj0DAQehRANCAATM4a6eiMnqf7mU\n" +
    "2V4ILiIeahztvfTaGcYjdmZXddS2qSph8Jdso4U4gl31DyY0Iar0db/WnYxgAMl/\n" +
    "5WGDAFWR\n" +
    "-----END PRIVATE KEY-----"

exports.getAppleTokenService = async function (identityToken,authorizationCode) {
    try {
        // identityToken 값 확인
        var base64Payload = identityToken.split('.')[1];
        //value 0 -> header, 1 -> payload, 2 -> VERIFY SIGNATURE
        var payload = Buffer.from(base64Payload, 'base64');
        var identitiyTokenResult = JSON.parse(payload.toString())

        const identitySub = identitiyTokenResult.sub;
        const subCheckResult = await userProvider.subCheck(identitySub);
        console.log('subCheck: ', subCheckResult)

        const tokenResult = await appleLogin.createSignWithAppleSecret();
        console.log('tokenResult :', tokenResult)

        // var apple_profile

        let apple_profile;

        // 이미 회원가입이 된경우 이경우 그냥 refreshToken값 갱신
        if (subCheckResult.length > 0) {

            const refreshToken = subCheckResult[0].refreshToken
            console.log('accessToken 갱신')

            const params = {
                grant_type: "refresh_token", // refresh_token authorization_code
                //redirect_uri: [REDIRECT_URI],
                client_id: "com.saekgalpi.ColorBookMark",
                client_secret: tokenResult,
                refresh_token: refreshToken,
                redirect_uri: "https://saekalpi.shop/auth/apple/callback"
                // refresh_token:body.id_token
            };

            try {
                const res = await axios.request({
                    method: 'POST',
                    url: 'https://appleid.apple.com/auth/token',
                    data: qs.stringify(params),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                // console.log('status : ', res.status)
                if (res.status === 200){
                    const data  = res.data;
                    // const access_token = data.access_token
                    // const refresh_token = data.access_token
                    // const id_token = data.id_token
                    // const decoded = jwt_decode(id_token);
                    // var email = decoded.email;
                    // var name = email.split('@')[0];
                    // const sub = decoded.sub;
                    // console.log('decoded:', decoded);
                    // console.log('id_token:', id_token);
                    // console.log('email:', email);
                    // console.log('sub:', sub);
                    // console.log('name:', name);
                    // console.log('access_token:', access_token);
                    // console.log('refresh_token:', refresh_token);
                    console.log("service.data : ",data)
                    console.log("service.data : ",data[0])
                    return data;
                }
            } catch (err) {
                if (err.response){
                    const errorRes = err;
                    // console.log('apple_profile : ', res)
                    console.log('error1', err.response.data);
                    console.log(err.response.status)
                    return errResponse(errorRes.response.data);
                }
                // return errResponse(JSON.parse(err.response.data));
            }
            return errResponse(baseResponse.DB_ERROR);
        }
        // 최초 회원가입시
        if (subCheckResult.length === 0) {
            console.log('최초 회원가입')

            const params = {
                grant_type: 'authorization_code', // refresh_token authorization_code
                code: authorizationCode, //apple Login Token
                //redirect_uri: [REDIRECT_URI],
                client_id: "com.saekgalpi.ColorBookMark",
                client_secret: tokenResult,
                redirect_uri: "https://saekalpi.shop/auth/apple/callback"
                // refresh_token:body.id_token
            };

            try {
                const res = await axios.request({
                    method: 'POST',
                    url: 'https://appleid.apple.com/auth/token',
                    data: qs.stringify(params),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                // console.log('status : ', res.status)
                if (res.status === 200){
                    const data  = res.data;
                    // const access_token = data.access_token
                    // const refresh_token = data.access_token
                    // const id_token = data.id_token
                    // const decoded = jwt_decode(id_token);
                    // var email = decoded.email;
                    // var name = email.split('@')[0];
                    // const sub = decoded.sub;
                    // console.log('decoded:', decoded);
                    // console.log('id_token:', id_token);
                    // console.log('email:', email);
                    // console.log('sub:', sub);
                    // console.log('name:', name);
                    // console.log('access_token:', access_token);
                    // console.log('refresh_token:', refresh_token);
                    console.log("service.data : ",data)
                    return data;
                }
            } catch (err) {
                if (err.response){
                    const errorRes = err;
                    // console.log('apple_profile : ', res)
                    console.log('error1', err.response.data);
                    console.log(err.response.status)
                    return { isSuccess: false, result: errorRes.response.data };

                }
                // return errResponse(JSON.parse(err.response.data));
            }
            return errResponse(baseResponse.DB_ERROR);
        }
    }
    catch (err) {
        logger.error(`App - getAppleTokenService error\n: ${err.message}`);
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

        console.log(`추가된 회원 : ${userIdResult[0].insertId}`);
        var userId = userIdResult[0].insertId
        console.log(userId)
        const insertUserColorResult = await userDao.insertUserColor(connection);
        const updateIniUserColorResult = await userDao.updateIniUserColor(connection, userId);
        connection.release();

        return userIdResult

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


        // //value 0 -> header, 1 -> payload, 2 -> VERIFY SIGNATURE
        // var payload1 = Buffer.from(base64Payload1, 'base64');
        // var payload2 = Buffer.from(base64Payload2, 'base64');
        // var identitiyTokenResult1 = JSON.parse(payload1.toString())
        // var identitiyTokenResult2 = JSON.parse(payload2.toString())



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

        return userInfoRows

    } catch (err) {
        logger.error(`App - postSocialSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};


exports.postAppleSignIn = async function (email) {
    try {

        const userInfoRows = await userProvider.emailCheck(email);

        // 계정 상태 확인 (탈퇴된 계정인지 아닌지 확인)
        if (userInfoRows[0].status === 'D') {
            return errResponse(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT);
        }

        // 검증절차 추후 고민
        //토큰 생성 Service
        // let token = await jwt.sign(
        //     {
        //         userId: userInfoRows[0].userId,
        //     }, // 토큰의 내용(payload)
        //     secret_config.jwtsecret, // 비밀키
        //     {
        //         expiresIn: "365d",
        //         subject: "userTB",
        //     } // 유효 기간 365일
        // );
        // console.log(token)
        return userInfoRows

    } catch (err) {
        logger.error(`App - postAppleSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
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
exports.editUserSocialToken = async function (userId, accessToken) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        let token = await jwt.sign (
            {
                userId : userId,
                accessToken : accessToken,
            },
            secret_config.jwtsecret,
            {
                expiresIn : "365d",
                subject : "userTB",
            }
        );

        const UserSocialToken = await userDao.updateSocialUserToken(connection, userId, token);
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - editUserSocialToken Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};

exports.editUserAppleToken = async function (userId, accessToken, refreshToken) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        var accessTemporary = accessToken
        var base64Payload1 = accessTemporary.split('.')[0];
        console.log('customize Token : ',base64Payload1)
        var base64Payload2 = accessTemporary.split('.')[2];
        console.log('customize Token : ',base64Payload2)
        var base64Payload3 = accessTemporary.split('.')[3];
        console.log('customize Token : ',base64Payload3)

        // 토큰 생성 Service
        const token = await jwt.sign(
            {
                userId: userId,
                accessToken : base64Payload1 + '.0.' + base64Payload2 + '.' + base64Payload3
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "userTB",
            } // 유효 기간 365일
        );
        console.log('editUserAppleToken jwt : ', token)

        const UserSocialToken = await userDao.updateAppleUserToken(connection, userId, token, refreshToken);
        connection.release();

        return response(baseResponse.SUCCESS);

    } catch (err) {
        logger.error(`App - editUserAppleToken Service error\n: ${err.message}`);
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