//////// 선택된 컬럼으로 조회 SELECTED

// 이메일로 회원 조회
async function selectUserEmail(connection, email) {
  const selectUserEmailQuery = `
                SELECT email, nickname, status, userId
                FROM userTB 
                WHERE email = ?;
                `;
  const [emailRows] = await connection.query(selectUserEmailQuery, email);
  return emailRows;
}

// 패스워드 조회
async function selectUserPassword(connection, selectUserPasswordParams) {
  const selectUserPasswordQuery = `
        SELECT email, nickname, password
        FROM userTB 
        WHERE email = ? AND password = ?;`;
  const selectUserPasswordRow = await connection.query(
      selectUserPasswordQuery,
      selectUserPasswordParams
  );
  return selectUserPasswordRow;
}

// JWT 조회
async function selectJWT(connection, userId) {
  const selectJWTQuery = `
                SELECT jwt, userId
                FROM tokenTB
                WHERE userId = ?;
                `;
  const [selectJWTRow] = await connection.query(selectJWTQuery, userId);

  return selectJWTRow;
};



// 모든 유저 조회
async function selectUser(connection) {
  const selectUserListQuery = `
                SELECT email, nickname 
                FROM userTB;
                `;
  const [userRows] = await connection.query(selectUserListQuery);
  return userRows;
}





// 컬럼값 추출 RETRIEVE

// 유저 상태값 추출
async function retrieveUserStatus(connection,userId) {
  const retrieveUserStatusQuery = `
                 SELECT userId, status, miniCodeStatus, BGMStatus, alarmStatus, NameStatus
                 FROM userTB
                 WHERE userId = ?;
                 `;
  const [userStatusRow] = await connection.query(retrieveUserStatusQuery, userId);
  return userStatusRow;
}




//유저 삭제
async function deleteUserStatus(connection, userId) {
  const deleteUserStatusQuery = `
  UPDATE userTB 
  SET status = 'N'
  WHERE userId = ?;
  `;
  const updateUserStatusRow = await connection.query(deleteUserStatusQuery, userId);
  return updateUserStatusRow[0];
}

// userId 회원 조회
async function selectUserId(connection, userId) {
  const selectUserIdQuery = `
                 SELECT id, email, nickname 
                 FROM userTB
                 WHERE id = ?;
                 `;
  const [userRow] = await connection.query(selectUserIdQuery, userId);
  return userRow;
}

// Select userId, userName
async function selectUserInfo(connection, email) {
  const userInfoQuery = `
  select userId, nickname
  from userTB
  where email = ?;`;
  const [userInfoRow] = await connection.query(userInfoQuery, email);
  return userInfoRow;
}


// Select userId, userName
async function checkMiniCode(connection, userId, miniCode) {
  const userInfoQuery = `
  select userId
  from userTB
  where userId = ${userId} and
    cast(miniCode as unsigned) = cast('${miniCode}' as unsigned);
  `;
  const [userInfoRow] = await connection.query(userInfoQuery,  userId, miniCode);
  return userInfoRow;
}



////////////// insert 새롭게 생성

// 유저 생성
async function insertUserInfo(connection, insertUserInfoParams) {
  const insertUserInfoQuery = `
        INSERT INTO userTB(email, password, nickname)
        VALUES (?, ?, ?);
    `;
  const insertUserInfoRow = await connection.query(
    insertUserInfoQuery,
    insertUserInfoParams
  );

  return insertUserInfoRow;
}

async function updateMiniCodeInfo(connection, userId, miniCode) {
  const updateMiniCodeQuery = `
  update userTB
  set miniCode = '${miniCode}'
  where userId = ?;`;
  const [updateMiniCodeRow] = await connection.query(updateMiniCodeQuery, userId, miniCode);
  return updateMiniCodeRow;
}


// 소셜 회원가입
async function insertSocialUser(connection, insertUserInfoParams) {
  const insertUserQuery = `
      INSERT INTO userTB(email, password, nickname, loginType)
      VALUES (?, ?, ?, 1);
  `;
  const insertUserRow = await connection.query(
      insertUserQuery,
      insertUserInfoParams
  );

  return insertUserRow;
}



////////// update return 값 없이 상태를 수정해주는 것

// 유저 상태 변경
async function updateUserStatus(connection, userId, alarmStatus, miniCodeStatus, NameStatus, BGMStatus) {
  const updateUserStatusQuery = `
  UPDATE userTB 
  SET alarmStatus = '${alarmStatus}',
      miniCodeStatus = '${miniCodeStatus}',
      NameStatus = '${NameStatus}',
      BGMStatus = '${BGMStatus}'
  WHERE userId = ?;
  `;
  const updateUserStatusRow = await connection.query(updateUserStatusQuery, userId, alarmStatus, miniCodeStatus, NameStatus, BGMStatus);
  return updateUserStatusRow[0];
}

// 유저 복귀
async function updateUser(connection, userId) {
  const updateUserStatusQuery = `
  UPDATE userTB 
  SET status = 'Y'
  WHERE userId = ?;
  `;
  const updateUserStatusRow = await connection.query(updateUserStatusQuery, userId);
  return updateUserStatusRow[0];
}



//유저 삭제
async function withdrawUserStatus(connection, usrId) {
  const updateUserStatusQuery = `
  UPDATE userTB 
  SET status = 'D'
  WHERE userId = ?;
  `;
  const updateUserStatusRow = await connection.query(updateUserStatusQuery, usrId);
  return updateUserStatusRow[0];
}

// 닉네임 값 변경
async function updateUserNickname(connection,userId, nickname) {
  const updateUserQuery = `
  UPDATE userTB 
  SET nickname = ?
  WHERE userId = ?;`;
  const updateUserRow = await connection.query(updateUserQuery, [userId, nickname]);
  return updateUserRow[0];
}

// 토큰 값 넣어주기
async function insertToken(connection, userId, token) {
  const insertTokenQuery = `
                INSERT INTO tokenTB(userId, jwt)
                VALUES(${userId}, '${token}');
                `;
  const insertTokenRow = await connection.query(insertTokenQuery, userId, token);

  return insertTokenRow;
};

// 토큰 값 변경
async function updateSocialUserToken(connection,userId, token) {
  const updateUserTokenQuery = `
  UPDATE tokenTB 
  SET jwt = '${token}'
  WHERE userId = ${userId};`;
  const updateUserRow = await connection.query(updateUserTokenQuery, [userId, token]);
  return updateUserRow[0];
}

async function deleteJWT(connection, userId) {
  const deleteJWTQuery = `
                DELETE FROM tokenTB
                WHERE userId = ?;
                `;
  const deleteJWTRow = await connection.query(deleteJWTQuery, userId);

  return deleteJWTRow;
};

// Patch Password
async function updatePassword(connection, [hashedPassword, email]) {
  const updateQuery = `
  update userTB
  set password = ?
  where email = ?;`;
  const [updateRow] = await connection.query(updateQuery, [hashedPassword, email]);
  return updateRow;
}

// Patch Password
async function updatePasswordByUserId(connection, [hashedPassword, userId]) {
  const updateQuery = `
  update userTB
  set password = ?
  where userId = ?;`;
  const [updateRow] = await connection.query(updateQuery, [hashedPassword, userId]);
  return updateRow;
}



module.exports = {
  selectUser,
  selectUserEmail,
  selectUserId,
  insertUserInfo,
  selectUserPassword,
  deleteJWT,
  insertToken,
  selectJWT,
  selectUserInfo,
  updatePassword,
  updatePasswordByUserId,
  updateUserStatus,
  retrieveUserStatus,
  deleteUserStatus,
  withdrawUserStatus,
  updateSocialUserToken,
  updateMiniCodeInfo,
  insertSocialUser,
  updateUser,
  updateUserNickname,
  checkMiniCode
};
