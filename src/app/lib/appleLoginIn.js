const jwt = require("jsonwebtoken");
const qs = require("querystring");
const axios = require('axios');
const secret_config = require("../../../config/secret");


const signWithApplePrivateKey = process.env.APPLE_SCRET_KEY="-----BEGIN PRIVATE KEY-----\n" +
    "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEhdLNG1LoKY9ISc9\n" +
    "ptoAJtOi5i4SLkkp9EqraZ3/5ZGgCgYIKoZIzj0DAQehRANCAATM4a6eiMnqf7mU\n" +
    "2V4ILiIeahztvfTaGcYjdmZXddS2qSph8Jdso4U4gl31DyY0Iar0db/WnYxgAMl/\n" +
    "5WGDAFWR\n" +
    "-----END PRIVATE KEY-----"


exports.createSignWithAppleSecret = async function() {
    console.log(1)
    var token = jwt.sign({},signWithApplePrivateKey, {
        algorithm: 'ES256',
        expiresIn: '10h',
        audience: 'https://appleid.apple.com',
        issuer: "69F5355JYF", // TEAM_ID
        subject: "com.saekgalpi.ColorBookMark", // Service ID
        keyid: "HWW5WPT2A4", // KEY_ID
    });
    console.log('token : ',token)
    return token;
};

exports.getClientSecret = async function() {
    const headers = {
        alg: 'ES256',
        kid: "HWW5WPT2A4"
    };
    const timeNow = Math.floor(Date.now() / 1000);
    const claims = {
        iss: "69F5355JYF",
        aud: 'https://appleid.apple.com',
        sub: "com.saekgalpi.ColorBookMark",
        iat: timeNow,
        exp: timeNow + 15777000
    };

    const token = jwt.sign(claims, signWithApplePrivateKey, {
        algorithm: 'ES256',
        header: headers
        // expiresIn: '24h'
    });

    return token;
};





// const identitySub = identitiyTokenResult.sub;
//
// const subCheckResult = await userProvider.subCheck(identitySub);
// console.log(subCheckResult)
// try {
// // 이미 회원가입이 된경우 이경우 그냥 refreshToken값 갱신
//     if(subCheckResult.length > 0){
//
//         const refreshToken = subCheckResult[0].refreshToken
//         console.log('accessToken 갱신')
//
//         const params = {
//             grant_type: "refresh_token", // refresh_token authorization_code
//             //redirect_uri: [REDIRECT_URI],
//             client_id: "com.saekgalpi.ColorBookMark",
//             client_secret: tokenResult,
//             refresh_token: refreshToken
//             // refresh_token:body.id_token
//         };
//
//         var apple_profile;
//         try {
//
//             apple_profile = axios.request({
//                 method: 'POST',
//                 url: 'https://appleid.apple.com/auth/token',
//                 data: qs.stringify(params),
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 }
//             }).then(response => {
//                 console.log('response', response);
//             }).catch(error => {
//                 console.log('error1', error.response.data);
//                 res.send({
//                     success: false,
//                     error: error.response.data
//                 })
//             })
//
//         } catch (error) {
//             console.log('error', error);
//         }
//
//
//     }
//     // 최초 회원가입시
//     if(subCheckResult.length === 0) {
//         console.log('최초 회원가입')
//
//         const params = {
//             grant_type: 'authorization_code', // refresh_token authorization_code
//             code: authorizationCode, //apple Login Token
//             //redirect_uri: [REDIRECT_URI],
//             client_id: "com.saekgalpi.ColorBookMark",
//             client_secret: tokenResult
//             // refresh_token:body.id_token
//         };
//
//         var apple_profile;
//         try {
//
//             apple_profile = axios.request({
//                 method: 'POST',
//                 url: 'https://appleid.apple.com/auth/token',
//                 data: qs.stringify(params),
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 }
//             }).then(response => {
//                 console.log('response', response);
//             }).catch(error => {
//                 console.log('error1', error.response.data);
//                 res.send({
//                     success: false,
//                     error: error.response.data
//                 })
//             })
//
//         } catch (error) {
//             console.log('error', error);
//         }
//
//     }
// const data = getAppleToken.data;






//
//
// async function apple_profile(params){
//     try {
//         const first = await axios.request({
//             method: 'POST',
//             url: 'https://appleid.apple.com/auth/token',
//             data: qs.stringify(params),
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         }).then(response => {
//             console.log('response', response.data);
//             return response.data
//         }).catch(error => {
//             console.log('error1', error.response.data);
//             return errResponse({
//                 success: false,
//                 error: error.response.data
//             })
//         })
//     } catch (error) {
//         console.log('error', error);
//     }
// }
// }
// // 최초 회원가입시
// if(subCheckResult.length === 0) {
//     console.log('최초 회원가입')
//
//     const params = {
//         grant_type: 'authorization_code', // refresh_token authorization_code
//         code: authorizationCode, //apple Login Token
//         //redirect_uri: [REDIRECT_URI],
//         client_id: "com.saekgalpi.ColorBookMark",
//         client_secret: tokenResult
//         // refresh_token:body.id_token
//     };
//
//     try {
//
//         axios.request({
//             method: 'POST',
//             url: 'https://appleid.apple.com/auth/token',
//             data: qs.stringify(params),
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         }).then(response => {
//             console.log('response', response.data);
//             return response.data
//         }).catch(error => {
//             console.log('error1', error.response.data);
//             return errResponse({
//                 success: false,
//                 error: error.response.data
//             })
//         })
//     } catch (error) {
//         console.log('error', error);
//     }
// }
// } catch (err) {
//     logger.error(`App - getAppleTokenService error\n: ${err.message}`);
//     return errResponse(baseResponse.DB_ERROR);
// }