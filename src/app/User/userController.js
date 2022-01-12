const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");
const {logger} = require("../../../config/winston");
const passport = require('passport')
const KakaoStrategy = require('passport-kakao').Strategy
const AppleStrategy = require('passport-apple');
const axios = require('axios');
const {emit} = require("nodemon");
const crypto = require("crypto");
const transporter = require('../../../config/email');
const http2 = require('http2')
const jwt = require("jsonwebtoken");
const secret_config = require("../../../config/secret");
const AppleAuth = require('apple-auth');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const qs = require("querystring");
const appleLogin = require('../../app/lib/appleLoginIn');
// const appleConfig = fs.readFileSync('../appleConfig/config.sample.json');
//
// let auth = new AppleAuth(appleConfig, fs.readFileSync('../appleConfig/AuthKey_92QR8UN434.p8').toString(), 'text');

const regPassword = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{6,16}/;
const regexEmail = require("regex-email");
const {check} = require("./userController");
const regPhoneNumber = /^\d{3}\d{3,4}\d{4}$/;
const regStatus = /^([Y|N])?$/;
const jwt_decode = require("jwt-decode");

const signWithApplePrivateKey = process.env.APPLE_SCRET_KEY="-----BEGIN PRIVATE KEY-----\n" +
    "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEhdLNG1LoKY9ISc9\n" +
    "ptoAJtOi5i4SLkkp9EqraZ3/5ZGgCgYIKoZIzj0DAQehRANCAATM4a6eiMnqf7mU\n" +
    "2V4ILiIeahztvfTaGcYjdmZXddS2qSph8Jdso4U4gl31DyY0Iar0db/WnYxgAMl/\n" +
    "5WGDAFWR\n" +
    "-----END PRIVATE KEY-----"


/**
 * API No. 0
 * API Name : 테스트 API
 * [GET] /app/test
 */
exports.getTest = async function (req, res) {
    return res.send(response(baseResponse.SUCCESS))
}

/**
 * API No. 1
 * API Name : 유저 생성 (회원가입) API
 * [POST] /app/users
 */
exports.postUsers = async function (req, res) {

    /**
     * Body: email, password, nickname
     */
    const {email, password, nickname} = req.body;

    // 빈 값 체크
    if (!email)
        return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
    if (!password)
        return res.send(response(baseResponse.SIGNUP_PASSWORD_EMPTY));
    if (!nickname)
        return res.send(response(baseResponse.SIGNUP_NICKNAME_EMPTY));

    // 길이 체크
    if (email.length > 30)
        return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
    if (password.length < 6 || password.length > 20) {
        return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
    }
    if (nickname.length > 20) {
        return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));
    }


    // 형식 체크 (by 정규표현식)
    if (!regexEmail.test(email))
        return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));


    // 기타 등등 - 추가하기

    const signUpResponse = await userService.createUser(
        email,
        password,
        nickname
    );

    return res.send(signUpResponse);
};

/**
 * API No. 2
 * API Name : 로그인 API
 * [POST] /app/login
 * body : email, passsword
 */
exports.login = async function (req, res) {

    const {email, password} = req.body;

    if (!email)
        return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));
    if (!password)
        return res.send(response(baseResponse.SIGNUP_PASSWORD_EMPTY));

    if (!regexEmail.test(email))
        return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    // if(!regPassword.test(password))
    //     return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_ERROR_TYPE));

    // 길이 체크
    if (email.length > 30)
        return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));
    if (password.length < 6 || password.length > 20) {
        return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
    }


    const signInResponse = await userService.postSignIn(email, password);

    return res.send(signInResponse);
};

// 이메일 중복체크 api
exports.emailCheck = async function (req, res) {

    const email = req.query.email;

    if (!email)
        return res.send(response(baseResponse.SIGNUP_EMAIL_EMPTY));

    // 형식 체크
    if (!regexEmail.test(email))
        return res.send(response(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    // 길이 체크
    if (email.length > 30)
        return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));

    const emailRows = await userProvider.emailCheck(email);
    console.log(emailRows)

    if (emailRows.length >= 1){
        return res.send(response(baseResponse.FAILURE));
    }
    return res.send(response(baseResponse.SUCCESS));
};


// /**
//     API No. 3
//     API Name : 로그아웃 API
//     [GET] /app/logout
// */
// exports.logOut = async function(req, res) {
//     const userIdFromJWT = req.verifiedToken.userId;
//
//     const token = req.headers['x-access-token'];
//     const checkJWT = await userProvider.checkJWT(userIdFromJWT);
//     if (checkJWT.length < 1) {
//         return res.send(response(baseResponse.NOT_LOGIN));
//     } else if (token != checkJWT[0].jwt) {
//         return res.send(response(baseResponse.TOKEN_VERIFICATION_FAILURE));
//     }
//
//     const logOutResponse = await userService.deleteJWT(userIdFromJWT);
//     return res.send(logOutResponse);
// }


/*
    API No. 4
    API Name : 유저 설정값 변경 API
    [PATCH] /app/users/status
*/
exports.patchUserStatus = async function (req, res) {

    const userId = req.verifiedToken.userId

    var {alarmStatus, miniCodeStatus, NameStatus, BGMStatus} = req.body;

    // // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    console.log(userStatusRows)
    if(userStatusRows[0].status === "D")
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));

    if (!userId) {
        return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));
    }


    // 미입력시 기존에 있던 설정값을 그대로 유지
    else {

        if (!alarmStatus) {
            alarmStatus = userStatusRows[0].alarmStatus
        }
        if (!miniCodeStatus) {
            miniCodeStatus = userStatusRows[0].miniCodeStatus
        }

        if (!NameStatus) {
            NameStatus = userStatusRows[0].NameStatus
        }
        if (!BGMStatus) {
            BGMStatus = userStatusRows[0].BGMStatus
        }

        // 형식 체크
        if (!regStatus.test(alarmStatus))
            return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));
        // 형식 체크
        if (!regStatus.test(miniCodeStatus))
            return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));
        // 형식 체크
        if (!regStatus.test(NameStatus))
            return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));
        // 형식 체크
        if (!regStatus.test(BGMStatus))
            return res.send(response(baseResponse.USER_STATUS_ERROR_TYPE));

        const editUserStatus = await userService.editUserStatus(userId, alarmStatus, miniCodeStatus, NameStatus, BGMStatus);
        return res.send(editUserStatus);
    }

}



/**
 * API No. 5
 * API Name : 미니코드 설정 API
 * [PATCH] /app/users/miniCode
 * body : miniCode
 */

exports.updateMiniCode = async function (req, res) {

    const userId = req.verifiedToken.userId

    // // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    if(userStatusRows[0].status === "D")
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));

    // 유저의 기본 미니코드 설정 확인 --> 만약에 N로 설정되어있으면 미니코드를 만들 수 없다.
    const miniCodeStatus = userStatusRows[0].miniCodeStatus

    if (miniCodeStatus == 'N')
        return res.send(response(baseResponse.CHECK_MINI_STATUSCODE));

    const {miniCode} = req.body;

    if (!userId) {
        return res.send(response(baseResponse.USER_USERID_EMPTY));
    }

    if (!miniCode) {
        return res.send(response(baseResponse.USER_MINICODE_EMPTY));
    }

    if (miniCode.length >= 5) {
        return res.send(response(baseResponse.SIGNUP_MINICODE_LENGTH));
    }

    const MiniCodeResult = await userService.updateMiniCode(userId, miniCode);
    return res.send(MiniCodeResult);

};


/**
 * API No. 5
 * API Name : 닉네임 수정
 * [PATCH] /app/users/nickname
 * body : nickname, miniCode
 */

exports.patchNickname = async function (req, res) {

    // jwt - userId, path variable :userId

    const userId = req.verifiedToken.userId

    if (!userId) {
        return res.send(response(baseResponse.USER_USERID_EMPTY));
    }

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    console.log(userStatusRows[0].status)
    if(userStatusRows[0].status === "D")
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));

    const miniCodeStatus = userStatusRows[0].miniCodeStatus
    // 미니코드가 설정되어있지 않다면 그냥 닉네임 변경 가능
    if (miniCodeStatus == 'N'){
        const nickname = req.body.nickname;

        if (!nickname) return res.send(errResponse(baseResponse.USER_NICKNAME_EMPTY));

        if (nickname.length > 20) {
            return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));
        }

        const editUserInfo = await userService.editUserNickname(userId, nickname)
        return res.send(editUserInfo);
    }

    const {nickname, miniCode} = req.body;
    if (!nickname) return res.send(errResponse(baseResponse.USER_NICKNAME_EMPTY));
    if (!miniCode) return res.send(errResponse(baseResponse.USER_MINICODE_EMPTY));

    if (nickname.length > 20) {
        return res.send(response(baseResponse.SIGNUP_NICKNAME_LENGTH));
    }

    if (miniCode.length >= 5) {
        return res.send(response(baseResponse.SIGNUP_MINICODE_LENGTH));
    }
    
    const checkMiniCode = await userProvider.checkMiniCode(userId, miniCode);
    if(checkMiniCode.length > 0){
        const editUserInfo = await userService.editUserNickname(userId, nickname)
        return res.send(editUserInfo);
    }
    else
        return res.send(response(baseResponse.SIGNUP_MINIPASSWORDS_UNMATCHED));

    return errResponse(baseResponse.DB_ERROR);
};

/**
 * API No. 5
 * API Name : 비밀번호 수정
 * [PATCH] /app/users/password
 * body : nickname, miniCode
 */

exports.patchPassword = async function (req, res) {

    const userId = req.verifiedToken.userId

    // 탈퇴한 계정인지 체크
    const userStatusRows = await userProvider.retrieveUserStatus(userId);
    console.log(userStatusRows[0].status)
    if(userStatusRows[0].status === "D")
        return res.send(response(baseResponse.SIGNIN_WITHDRAWAL_ACCOUNT));

    const {password1,password2} = req.body;

    if (!password1) return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_EMPTY));
    if (!password2) return res.send(errResponse(baseResponse.SIGNUP_PASSWORD2_EMPTY));

    if (password1.length < 7 || password1.length > 20) {
        return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
    }

    if (password2.length < 7 || password2.length > 20) {
        return res.send(response(baseResponse.SIGNUP_PASSWORD_LENGTH));
    }


    if(password1 != password2) return res.send(errResponse(baseResponse.SIGNUP_PASSWORDS_UNMATCHED));

    try {

        const hashedPassword1 = await crypto
            .createHash("sha512")
            .update(password1)
            .digest("hex");

        const result = await userService.patchPasswordByUserId(hashedPassword1, userId);
        return res.send(response(baseResponse.USER_PASSWORD_UPDATE_SUCCESS));

    } catch(err) {
        logger.error(`App - patchPassword error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
};



// /**
//  * API No. 6
//  * API Name : JWT 토큰 검증 API
//  * [GET] /app/auto-login
//  * header : x-access-token
//  */
//
// exports.check = async function (req, res) {
//     // jwt - userId
//
//     const userIdFromJWT = req.verifiedToken.userId;
//
//
//     const token = req.headers['x-access-token'];
//     const checkJWT = await userProvider.checkJWT(userIdFromJWT);
//
//     if (!userIdFromJWT) {
//         return res.send(errResponse(baseResponse.SIGNIN_JWT_TOKEN_NOT_EXIST));
//     } else if (token == checkJWT[0].jwt) {
//         return res.send(response(baseResponse.SUCCESS, {"userId": userIdFromJWT}));
//     } else {
//         return res.send(response(baseResponse.TOKEN_VERIFICATION_FAILURE));
//     }
// };


/**
 * API No. 6
 * API Name : 카카오 로그인 API
 * [PATCH] /users/kakao-login
 */

passport.use('kakao-login', new KakaoStrategy({
    clientID: '0a8a336f06243c943b2015623c8290b6',
    callbackURL: 'https://saekalpi.shop/auth/kakao/callback',
}, async (accessToken, refreshToken, profile, done) =>
{
    console.log('kakao :',accessToken);
    console.log(profile);
}));

passport.use('apple-login',new AppleStrategy(
    {
        clientID: 'com.saekgalpi.ColorBookMark',
        teamID:'69F5355JYF',
        callbackURL: 'https://saekalpi.shop/auth/apple/callback',
        keyID: 'HWW5WPT2A4',
        privateKeyLocation: signWithApplePrivateKey,
        passReqToCallback: true

    }, function(accessToken, refreshToken, idToken, profile, cb) {
        // Here, check if the idToken exists in your database!
        console.log(idToken,profile);
        cb(null, idToken);
    }));

exports.kakaoLogin = async function(req, res) {

    const {accessToken} = req.body;

    if (!accessToken)
        return res.send(errResponse(baseResponse.ACCESS_TOKEN_EMPTY))


    try {
        let kakao_profile;

        try {
            kakao_profile = await axios.get('https://kapi.kakao.com/v2/user/me', {
                headers: {
                    Authorization: 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                }

            })
        } catch (err) {
            return res.send(errResponse(baseResponse.ACCESS_TOKEN_FAILURE));
        }

        const data = kakao_profile.data.kakao_account;
        const email = data.email;
        const name = data.profile.nickname;
        if(!data.profile.nickname){
            const name = email.split('@')[0];
        }

        const emailCheckResult = await userProvider.emailCheck(email);

        // 기존에 존재하는 유저
        if (emailCheckResult.length != 0)  {
            var userInfoRow = await userProvider.getUserInfo(email);

            var tokenResult = await userProvider.checkJWT(emailCheckResult[0].userId);
            if(tokenResult.length != 0){
                userInfoRow = await userService.editUserSocialToken(emailCheckResult[0].userId,accessToken);
            }
            if (tokenResult.length == 0){
                tokenResult = await userProvider.updateSocialToken(emailCheckResult[0].userId, accessToken);
            }

            tokenResult = await userProvider.checkJWT(emailCheckResult[0].userId);

            return res.send(response(baseResponse.SUCCESS, {'userId' : emailCheckResult[0].userId, 'jwt' : tokenResult[0].jwt , 'message' : '소셜로그인에 성공하셨습니다.'}));
        }
        else {
            const result = {
                name : name,
                email : email
            }

            const  kakaoSignUpResponse = await userService.createSocialUser(result.email, result.name);
            console.log('kakao NEW user : ',kakaoSignUpResponse[0].insertId)

            var tokenResult = await userProvider.updateSocialToken(kakaoSignUpResponse[0].insertId, accessToken);
            const kakaoSignInResponse = await userService.postSocialSignIn(result.email);

            tokenResult = await userProvider.checkJWT(kakaoSignUpResponse[0].insertId);

            return res.send(response(baseResponse.SUCCESS, {'userId' : kakaoSignUpResponse[0].insertId, 'jwt' : tokenResult[0].jwt , 'message' : '소셜로그인에 성공하셨습니다.'}));

        }

    } catch(err) {
        logger.error(`App - kakaoLogin Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}


// /**
//  * API No. 8
//  * API Name : 애플 로그인 API
//  * [POST] /users/find-password
//  */
//


exports.appleLogin = async function(req, res) {

    var { identityToken,authorizationCode } = req.body;
    if (!identityToken)  return res.send(errResponse(baseResponse.ACCESS_IDENTITYTOKEN_EMPTY))
    if (!authorizationCode)  return res.send(errResponse(baseResponse.ACCESS_AUTHORIZATIONCODE_EMPTY))

    // const newToken = await appleLogin.getClientSecret();
    // console.log('newToken :',newToken)
    // const tokenResult = await appleLogin.createSignWithAppleSecret();
    // console.log('tokenResult :',tokenResult)
    //
    // var base64Payload = identityToken.split('.')[1];
    // //value 0 -> header, 1 -> payload, 2 -> VERIFY SIGNATURE
    // var payload = Buffer.from(base64Payload, 'base64');
    // var identitiyTokenResult = JSON.parse(payload.toString())

    var data = null;
    var accessToken = null;
    var refreshToken = null;
    var id_token = null;

    try {
        // 유저에게 받은 identityToken 값 확인
        var base64Payload = identityToken.split('.')[1];
        //value 0 -> header, 1 -> payload, 2 -> VERIFY SIGNATURE
        var payload = Buffer.from(base64Payload, 'base64');
        var identitiyTokenResult = JSON.parse(payload.toString())

        const identitySub = identitiyTokenResult.sub;
        const identitySubCheckResult = await userProvider.subCheck(identitySub);
        console.log('subCheck: ', identitySubCheckResult)

        const tokenResult = await appleLogin.createSignWithAppleSecret();
        console.log('tokenResult :', tokenResult)

        // var apple_profile

        // 이미 회원가입이 된경우 이경우 그냥 refreshToken값 갱신
        if (identitySubCheckResult.length > 0) {

            refreshToken = identitySubCheckResult[0].refreshToken
            console.log('기존 refreshToken :', refreshToken)
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
                    data  = res.data;
                    accessToken = data.access_token
                    if(data.refresh_token){
                        refreshToken = data.refresh_token
                    }
                    refreshToken = identitySubCheckResult[0].refreshToken
                    id_token = data.id_token
                    console.log("service.data : ",data)
                    console.log("accessToken.data : ",accessToken)
                    console.log("AfterRefreshToken.data : ",refreshToken)

                }
            } catch (err) {
                if (err.response){
                    // const errorRes = err;
                    // // console.log('apple_profile : ', res)
                    // console.log('error1', err.response.data);
                    // return { isSuccess: false, result: errorRes.response.data };
                    return res.send(errResponse(baseResponse.ACCESS_TOKEN_FAILURE));
                }
                // return errResponse(JSON.parse(err.response.data));
            }
        }
        // 최초 회원가입시
        if (identitySubCheckResult.length === 0) {
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
                    data  = res.data;
                    accessToken = data.access_token
                    refreshToken = data.refresh_token
                    id_token = data.id_token
                    console.log("service.data : ",data)
                    console.log("accessToken.data : ",accessToken)
                    console.log("AfterRefreshToken.data : ",refreshToken)
                }
            } catch (err) {
                if (err.response){
                    // const errorRes = err;
                    // // console.log('apple_profile : ', res)
                    // console.log('error1', err.response.data);
                    // return { isSuccess: false, result: errorRes.response.data };
                    return res.send(errResponse(baseResponse.ACCESS_TOKEN_FAILURE));
                }
                // return errResponse(JSON.parse(err.response.data));
            }
        }

        const decoded = jwt_decode(id_token);
        var email = decoded.email;
        var name = email.split('@')[0];
        const sub = decoded.sub;
        console.log('decoded:', decoded);
        console.log('id_token:', id_token);
        console.log('email:', email);
        console.log('sub:', sub);
        console.log('name:', name);
        console.log('access_token:', accessToken);
        console.log('refresh_token:', refreshToken);


        if(decoded.is_private_email = 'true'){
            name = email.split('@')[0];
            email = name + '@appleTempory.com'
        }

        const subCheckResult = await userProvider.subCheck(sub);
        const emailCheckResult = await userProvider.emailCheck(email);

        // 기존에 존재하는 아이디인 경우
        if (emailCheckResult.length != 0)  {

            const tokenResult = await userProvider.checkJWT(emailCheckResult[0].userId);
            if(tokenResult.length != 0){
                const userAppleTokenResult = await userService.editUserAppleToken(emailCheckResult[0].userId,accessToken, refreshToken)
            }
            if (tokenResult.length == 0){
                const tokenResult = await userProvider.updateAppleToken(emailCheckResult[0].userId, accessToken, refreshToken);
            }

            const subCheckResultForJWT = await userProvider.subCheck(sub);
            console.log(subCheckResultForJWT[0].jwt)

            return res.send(response(baseResponse.SUCCESS, {'userId' : emailCheckResult[0].userId, 'jwt' : subCheckResultForJWT[0].jwt ,
                'refreshToken' : refreshToken ,'message' : '소셜로그인에 성공하셨습니다.'}));
        }
        else {
            const appleResult = {
                name : name,
                email : email,
                sub : sub
            }

            const  appleSignUpResponse = await userService.createAppleUser(appleResult.email, appleResult.name, appleResult.sub);

            console.log(appleSignUpResponse[0].insertId)

            const tokenResult = await userProvider.updateAppleToken(appleSignUpResponse[0].insertId, accessToken, refreshToken);

            const subCheckResultForJWT = await userProvider.subCheck(appleResult.sub);

            const appleSignInResponse = await userService.postAppleSignIn(appleResult.email);

            return res.send(response(baseResponse.SUCCESS, {'userId' : appleSignUpResponse[0].insertId, 'jwt' : subCheckResultForJWT[0].jwt ,
                'refreshToken' : refreshToken ,'message' : '소셜로그인에 성공하셨습니다.'}));
        }
    }
    catch (err) {
        logger.error(`App - AppleLogin error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}


exports.appleTokenLogin = async function(req, res) {

    var { identityToken,authorizationCode } = req.body;
    if (!identityToken)  return res.send(errResponse(baseResponse.ACCESS_IDENTITYTOKEN_EMPTY))
    if (!authorizationCode)  return res.send(errResponse(baseResponse.ACCESS_AUTHORIZATIONCODE_EMPTY))

    const getAppleToken = await userService.getAppleTokenService(identityToken,authorizationCode);

    return res.send(getAppleToken);

}

/**
 * API No. 8
 * API Name : 비밀번호 찾기 API
 * [POST] /users/find-password
 */

function createCode(numeric, alphabet, signal) {
    var randomStr = "";

    for (var j = 0; j < 2; j++) {
        randomStr += numeric[Math.floor(Math.random()*numeric.length)];
    }
    for (var j = 0; j < 5; j++) {
        randomStr += alphabet[Math.floor(Math.random()*alphabet.length)];
    }
    for (var j = 0; j < 1; j++) {
        randomStr += signal[Math.floor(Math.random()*signal.length)];
    }

    return randomStr
}

exports.findPassword = async function (req, res) {

    const {email} = req.body;
    if (!email)
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_EMPTY))
    if (email.length > 30)
        return res.send(response(baseResponse.SIGNUP_EMAIL_LENGTH));

    // 이메일 존재 여부 확인
    const emailRows = await userProvider.emailCheck(email);
    if (emailRows.length === 0)
        return res.send(errResponse(baseResponse.USER_USEREMAIL_NOT_EXIST))

    try {
        const numeric = "0,1,2,3,4,5,6,7,8,9".split(',');
        const alphabet = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z".split(",");
        const signal = "!,@,#,$".split(",");

        const password = createCode(numeric, alphabet, signal);
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const emailOption = {
            from : '색갈피',
            to : email,
            subject : '색갈피 임시 비밀번호 발급',
            html : `<p>임시 비밀번호는 <b>${password}</b>입니다.</p>`
        }

        await userService.patchPassword(hashedPassword, email);

        let flag = 0;
        await transporter.sendMail(emailOption, (err, flag) => {
            if (err) {
                flag = 1
            }
            else flag = 0;
        });

        if (flag === 1) {
            transporter.close();
            logger.error(`App - passwordSendMail Query error\n: ${JSON.stringify(err)}`);
            return res.json(response.FAILURE("임시 비밀번호 발급에 실패했습니다."));
        } else {
            console.log(emailOption)
            transporter.close();
            return res.send(response(baseResponse.SUCCESS, "임시 비밀번호가 성공적으로 발급되었습니다."));
        }

    } catch(err) {
        logger.error(`App - Find Password Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }

};


/*
    API No. 9
    API Name : 유저 탈퇴 API  ->> 탈퇴된 유저의 정보는 찾을 수 없다. 이메일 값을 null 값으로 변경, 그렇지만 그 데이터는 남아있다.
    [PATCH] /app/users/:usrId/status
*/

exports.withdrawUserStatus = async function (req, res) {

    const userIdFromJWT = req.verifiedToken.userId;
    const userId = req.params.userId;

    if (!userId) {
        return res.send(response(baseResponse.USER_USERID_EMPTY));
    }

    // 테이블에 존재하는 최대 유저아이디 값보다 더 큰 유저아이디 값을 입력하면 에러
    const MaxUserId = await userProvider.checkMaxUserId();
    console.log(MaxUserId[0].userId)
    if (MaxUserId[0].userId < userId || userId < 0)
        return res.send(errResponse(baseResponse.USER_USERID_NOT_EXIST));

    if (userIdFromJWT != userId)
        return res.send(errResponse(baseResponse.USER_ID_NOT_MATCH));

    const deleteUserResult = await userService.withdrawUser(userId);
    return res.send(deleteUserResult);

};