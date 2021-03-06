const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");
const secret_config = require("../../../config/secret");
const jwt = require("jsonwebtoken");

const userDao = require("./userDao");

// Provider: Read 비즈니스 로직 처리
//////////// 존재여부 확인 CHECK


// 이메일 존재여부 확인  email, nickname, status, userId
exports.emailCheck = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const emailCheckResult = await userDao.selectUserEmail(connection, email);
  connection.release();

  return emailCheckResult;
};

exports.subCheck = async function (sub) {
  const connection = await pool.getConnection(async (conn) => conn);
  const subCheckResult = await userDao.selectUserSub(connection, sub);
  connection.release();

  return subCheckResult;
};


// 패스워드 존재여부 확인   email, nickname, password
exports.passwordCheck = async function (selectUserPasswordParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const passwordCheckResult = await userDao.selectUserPassword(
      connection,
      selectUserPasswordParams
  );
  connection.release();
  return passwordCheckResult[0];
};



// JWT 존재여부 확인   jwt, userId
exports.checkJWT = async function(userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const checkJWTResult = await userDao.selectJWT(connection, userId);
  connection.release();

  return checkJWTResult;
};

// 미니코드 재대로 입력하였는지 체크
exports.checkMiniCode = async function (userId, miniCode) {
  const connection = await pool.getConnection(async (conn) => conn);
  const miniCodeResult = await userDao.checkMiniCode(connection, userId, miniCode);
  connection.release();

  return miniCodeResult;
};


exports.checkMaxUserId = async function () {
  const connection = await pool.getConnection(async (conn) => conn);
  const MaxUserIdResult = await userDao.checkMaxUserId(connection);
  connection.release();

  return MaxUserIdResult;
};




////// RETRIEVE -- 컬럼 값을 추출할 때 사용

// 유저 상태값 추출     userId, status, miniCodeStatus, BGMStatus, alarmStatus, NameStatus
exports.retrieveUserStatus = async function (userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const retrieveUserStatus = await userDao.retrieveUserStatus(connection, userId);

  connection.release();

  return retrieveUserStatus;
};



exports.retrieveUserList = async function (email) {
  if (!email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const userListResult = await userDao.selectUser(connection);
    connection.release();

    return userListResult;

  } else {
    const connection = await pool.getConnection(async (conn) => conn);
    const userListResult = await userDao.selectUserEmail(connection, email);
    connection.release();

    return userListResult;
  }
};

exports.retrieveUser = async function (userId) {
  const connection = await pool.getConnection(async (conn) => conn);
  const userResult = await userDao.selectUserId(connection, userId);

  connection.release();

  return userResult[0];
};




exports.getUserInfo = async function (email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const getUserInfoResult = await userDao.selectUserInfo(connection, email);

  connection.release();

  return getUserInfoResult;
};


exports.updateSocialToken = async function (userId, accessToken) {
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

  const tokenResult = await userDao.insertToken(connection, userId, token);
  connection.release();

  return tokenResult;
};

exports.updateAppleToken = async function (userId, accessToken, refreshToken) {
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

    console.log('updateAppleToken jwt : ', token)

    const tokenResult = await userDao.insertAppleToken(connection, userId, token, refreshToken );
    connection.release();

    return tokenResult;

  } catch (err) {
    logger.error(`App - updateAppleToken Service error\n: ${err.message}`);
    return errResponse(baseResponse.DB_ERROR);
  }

};