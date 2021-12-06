// userIdx Check
async function selectUserId(connection, userId) {
    const userIdQuery = `
    select userId
    from userTB
    where userId = ?;
     `;
    const [userIdRow] = await connection.query(userIdxQuery, userId);
    return userIdRow;
}

// 최신순 정렬
async function selectUserHistory(connection, userId) {
    const userHistoryQuery = `
        select diaryId,color,
               case
                   when userTB.NameStatus = 'N'
                       then null
                   else colorName
                   end as 'colorName',nickname,date
        from diaryTB
            join userTB on userTB.userId = diaryTB.userId
        where userTB.userId = ?
        order by date DESC;
     `;
    const [userHistoryRow] = await connection.query(userHistoryQuery, userId);
    return userHistoryRow;
}

async function selectDiaryDate(connection, userId, date) {
    const selectDiaryDateQuery = `
        select userTB.userId,diaryId,color,        
               case
               when userTB.NameStatus = 'N'
                   then null
               else colorName
            end as 'colorName',nickname
        from diaryTB
                 join userTB on userTB.userId = diaryTB.userId
        where userTB.userId = ? AND
            date(STR_TO_DATE('${date}', '%Y-%m-%d')) = date_format(diaryTB.date,'%Y-%m-%d');
     `;
    const [userHistoryRow] = await connection.query(selectDiaryDateQuery, userId, date);
    return userHistoryRow;
}


// 기본 홈 컬러 조회
async function selectBasicColor(connection) {
        const basicColorQuery = `
            select hex(color) as color,colorName
            from basicColorTB
            limit 13;
     `;
        const [basicColorRow] = await connection.query(basicColorQuery);
        return basicColorRow;
}


// 기본 홈 컬러 조회
async function selectMyColor(connection, userId) {
    const myColorQuery = `
        select myColorId, color ,colorName
        from myColorTB
        where color is not null and userId = ${userId}
        order by updatedAt DESC;
     `;
    const [basicColorRow] = await connection.query(myColorQuery, userId);
    return basicColorRow;
}


// 많이 사용한 3가지 컬러, 동률 시 최신순 기준 조회
async function selectMyMostColor(connection, userId) {
    const myColorQuery = `
        SELECT T.color as color, count FROM
            (select color,date,
                 ROW_NUMBER() OVER(PARTITION BY color ORDER BY date DESC) AS RANKING
             from diaryTB
                 join userTB on userTB.userId = diaryTB.userId
             where userTB.userId = ${userId}
             order by RANKING) T
                join  (select color, COUNT(*) AS count
                       from diaryTB
                           join userTB on userTB.userId = diaryTB.userId
                       where userTB.userId = ${userId}
                       GROUP BY color
                       ORDER BY count DESC) C
                      on T.color = C.color
        where RANKING = 1
        ORDER BY count DESC
            limit 3;
     `;
    const [basicColorRow] = await connection.query(myColorQuery, userId);
    return basicColorRow;
}

async function selectNewMyMostColor(connection, userId) {
    const myColorQuery = `
        SELECT T.color as color, count FROM
            (select color,date,
                 ROW_NUMBER() OVER(PARTITION BY color ORDER BY date DESC) AS RANKING
             from diaryTB
                 join userTB on userTB.userId = diaryTB.userId
             where userTB.userId = ${userId}
             order by RANKING) T
                join  (select color, COUNT(*) AS count
                       from diaryTB
                           join userTB on userTB.userId = diaryTB.userId
                       where userTB.userId = ${userId}
                       GROUP BY color
                       ORDER BY count DESC) C
                      on T.color = C.color
        where RANKING = 1
        UNION
        SELECT color, count
        FROM defaultColorTB
        ORDER BY count DESC
            limit 3;
     `;
    const [basicColorRow] = await connection.query(myColorQuery, userId);
    return basicColorRow;
}

// myColorId 값으로 특정 컬러, 컬러 이름 추출
async function selectMyColorId(connection, myColorId) {
    const myColorQuery = `
        select userId, color ,colorName
        from myColorTB
        where color is not null and myColorId = ${myColorId};
     `;
    const [basicColorRow] = await connection.query(myColorQuery, myColorId);
    return basicColorRow;
}

//
async function selectMyColorIdCheck(connection, userId) {
    const myColorPostQuery = `
        select myColorId
        from myColorTB
        where color is null and userId =?;
     `;
    const [basicColorRow] = await connection.query(myColorPostQuery, userId);
    return basicColorRow;
}


async function selectMyColorIdCheckByMyColorId(connection, myColorId) {
    const myColorPostQuery = `
        select userId
        from myColorTB
        where myColorId =?;
     `;
    const [basicColorRow] = await connection.query(myColorPostQuery, myColorId);
    return basicColorRow;
}


async function selectCheckMaxMyColorId(connection) {
    const myColorPostQuery = `
        select myColorId
        from myColorTB
        order by myColorId DESC
        limit 1;
     `;
    const [basicColorRow] = await connection.query(myColorPostQuery);
    return basicColorRow;
}



// 가장 많이 사용한 컬러값을 기준으로 최신화, 오늘 등록한 컬러값이 있다면 가장 최우선
async function selectHomeColorView(connection,userId) {
    const homeColorQuery = `
        select a.color, a.colorName
        from (SELECT basicColorTB.color, count(basicColorTB.color) as cnt,colorName
              FROM basicColorTB
              WHERE basicColorTB.color
                        NOT IN ((SELECT diaryTB.color
                                 FROM diaryTB
                                 WHERE userId = ${userId}
                                 GROUP BY diaryTB.color)
                    )
              GROUP BY basicColorTB.color
              UNION
              SELECT diaryTB.color, count(diaryTB.color) + 1 as cnt, colorName
              FROM diaryTB
              where userId = ${userId} and diaryTB.color NOT IN ((SELECT diaryTB.color
                                                          FROM diaryTB WHERE DATE_FORMAT(diaryTB.date, "%Y-%m-%d") = CURDATE() and userId = ${userId})
              )
              GROUP BY diaryTB.color
              UNION
              SELECT diaryTB.color, count(diaryTB.color) + 1000 as cnt, colorName
              FROM diaryTB WHERE DATE_FORMAT(diaryTB.date, "%Y-%m-%d") = CURDATE() and userId = ${userId}
             ) a
        where a.color is not null
        order by a.cnt DESC
        limit 20;
     `;
    const [basicColorRow] = await connection.query(homeColorQuery, userId);
    return basicColorRow;
}


async function selectTodayDiary(connection, userId) {
    const userTodayQuery = `
    select diaryId,color,        
            case
             when userTB.NameStatus = 'N'
                 then null
             else colorName
        end as 'colorName',nickname
    from diaryTB
    join userTB on userTB.userId = diaryTB.userId
    where userTB.userId = ? AND DATE_FORMAT(diaryTB.date, "%Y-%m-%d") = CURDATE();
     `;
    const [userTodayRow] = await connection.query(userTodayQuery, userId);
    return userTodayRow;
}

async function selectCurrentMonthDiary(connection, userId) {
    const currentMonthQuery = `
        select DISTINCT temp_date as 'date',diaryTB.diaryId,
                        color,
                        case
                            when userTB.NameStatus = 'N'
                                then null
                            else colorName
                            end as 'colorName', userTB.userId,
                        CASE content WHEN diaryTB.content IS NULL THEN 1 ELSE 0 END as content,
                        CASE recordContent WHEN diaryTB.recordContent IS NULL THEN 1 ELSE 0 END as recordContent,
                        CASE diaryImgUrl WHEN diaryImgTB.diaryImgUrl IS NULL THEN 1 ELSE 0 END as diaryImgUrl


        from (
                 select date_format(aa.temp_date, '%Y-%m-%d') temp_date,
                        count(diaryId) as                     cnt,
                        ${userId} as 'temp_userId'
                 from temp_data aa
                          left join
                      diaryTB c on (STR_TO_DATE(c.date, '%Y-%m-%d') = aa.temp_date)
                          and userId = ${userId}
                 group by date_format(temp_date, '%Y%m%d')
             ) a
                 left join diaryTB
                           on diaryTB.userId = a.temp_userId and (STR_TO_DATE(diaryTB.date, '%Y-%m-%d') = a.temp_date)
                 left join userTB on diaryTB.userId = userTB.userId
                 left join diaryImgTB on diaryTB.diaryId = diaryImgTB.diaryId

        where temp_date like concat('%', (DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 0 MONTH), '%Y-%m')), '%')
          and color is not null;
     `;
    const [currentMonthRow] = await connection.query(currentMonthQuery, userId);
    return currentMonthRow;
}


async function selectBookMarkMonthDiary(connection, userId, page) {
    const currentMonthQuery = `
        select DISTINCT temp_date as 'date',diaryTB.diaryId,
                        color,
                        case
                            when userTB.NameStatus = 'N'
                                then null
                            else colorName
                            end as 'colorName', userTB.userId,
                        CASE content WHEN diaryTB.content IS NULL THEN 1 ELSE 0 END as content,
                        CASE recordContent WHEN diaryTB.recordContent IS NULL THEN 1 ELSE 0 END as recordContent,
                        CASE diaryImgUrl WHEN diaryImgTB.diaryImgUrl IS NULL THEN 1 ELSE 0 END as diaryImgUrl


        from (
                 select date_format(aa.temp_date, '%Y-%m-%d') temp_date,
                        count(diaryId) as                     cnt,
                        ${userId} as 'temp_userId'
                 from temp_data aa
                          left join
                      diaryTB c on (STR_TO_DATE(c.date, '%Y-%m-%d') = aa.temp_date)
                          and userId = ${userId}
                 group by date_format(temp_date, '%Y%m%d')
             ) a
                 left join diaryTB
                           on diaryTB.userId = a.temp_userId and (STR_TO_DATE(diaryTB.date, '%Y-%m-%d') = a.temp_date)
                 left join userTB on diaryTB.userId = userTB.userId
                 left join diaryImgTB on diaryTB.diaryId = diaryImgTB.diaryId

        where temp_date like concat('%', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL ${page} MONTH), '%Y-%m'), '%')
          and color is not null;
     `;
    const [currentMonthRow] = await connection.query(currentMonthQuery, userId, page);
    return currentMonthRow;
}



async function selectBookMarkTargetMonthDiary(connection, userId, date) {
    const currentMonthQuery = `
        select DISTINCT temp_date as 'date',diaryTB.diaryId,
                        color,
                        case
                            when userTB.NameStatus = 'N'
                                then null
                            else colorName
                            end as 'colorName', userTB.userId,
                        CASE content WHEN diaryTB.content IS NULL THEN 1 ELSE 0 END as content,
                        CASE recordContent WHEN diaryTB.recordContent IS NULL THEN 1 ELSE 0 END as recordContent,
                        CASE diaryImgUrl WHEN diaryImgTB.diaryImgUrl IS NULL THEN 1 ELSE 0 END as diaryImgUrl


        from (
                 select date_format(aa.temp_date, '%Y-%m-%d') temp_date,
                        count(diaryId) as                     cnt,
                        ${userId} as 'temp_userId'
                 from temp_data aa
                          left join
                      diaryTB c on (STR_TO_DATE(c.date, '%Y-%m-%d') = aa.temp_date)
                          and userId = ${userId}
                 group by date_format(temp_date, '%Y%m%d')
             ) a
                 left join diaryTB
                           on diaryTB.userId = a.temp_userId and (STR_TO_DATE(diaryTB.date, '%Y-%m-%d') = a.temp_date)
                 left join userTB on diaryTB.userId = userTB.userId
                 left join diaryImgTB on diaryTB.diaryId = diaryImgTB.diaryId

        where temp_date like concat('%', (DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 0 MONTH), '%Y-%m')), '%')
          and color is not null;
     `;
    const [currentMonthRow] = await connection.query(currentMonthQuery, userId, date);
    return currentMonthRow;
}



async function selectMonthDiary(connection, userId,page) {
    const currentMonthQuery = `
        select DISTINCT temp_date as 'date',
                        color,
                        case
                            when userTB.NameStatus = 'N'
                                then null
                            else colorName
                            end as 'colorName'
        from (
                 select date_format(aa.temp_date, '%Y-%m-%d') temp_date,
                        count(diaryId) as                     cnt,
                        ${userId} as 'temp_userId'
                 from temp_data aa
                          left join
                      diaryTB c on (STR_TO_DATE(c.date, '%Y-%m-%d') = aa.temp_date)
                          and userId = ${userId}
                 group by date_format(temp_date, '%Y%m%d')
             ) a
                 left join diaryTB
                           on diaryTB.userId = a.temp_userId and (STR_TO_DATE(diaryTB.date, '%Y-%m-%d') = a.temp_date)
                 left join userTB on diaryTB.userId = userTB.userId
        where temp_date like concat('%', DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL ${page} MONTH), '%Y-%m'), '%');
     `;
    const [currentMonthRow] = await connection.query(currentMonthQuery, userId, page);
    return currentMonthRow;
}





async function selectDiary(connection, diaryId) {
    const selectDiaryQuery = `
    select diaryId, color,         
           case
           when userTB.NameStatus = 'N'
               then null
           else colorName
        end as 'colorName', nickname, content, recordContent, date as 'date'
    from diaryTB
    join userTB on userTB.userId = diaryTB.userId
    where diaryTB.diaryId = ?
     `;
    const [selectDiaryRow] = await connection.query(selectDiaryQuery, diaryId);
    return selectDiaryRow;
}

// 다이어리 상태값 출력
async function selectDiaryStatus(connection, diaryId) {
    const selectDiaryStatusQuery = `
    select status, isManyImg, isFulled
    from diaryTB
    join userTB on userTB.userId = diaryTB.userId
    where diaryTB.diaryId = ?
     `;
    const [selectDiaryRow] = await connection.query(selectDiaryStatusQuery, diaryId);
    return selectDiaryRow;
}


async function selectDiaryId(connection, diaryId) {
    const userDiaryIdQuery = `
    select diaryId,color,        
           case
         when userTB.NameStatus = 'N'
             then null
         else colorName
        end as 'colorName',userTB.userId
    from diaryTB
    join userTB on userTB.userId = diaryTB.userId
    where diaryTB.diaryId = ?
     `;
    const [userDiaryIdRow] = await connection.query(userDiaryIdQuery, diaryId);
    return userDiaryIdRow;
}

async function selectDiaryImgId(connection, diaryImgId) {
    const userDiaryImgIdQuery = `
        select diaryImgTB.diaryId,diaryImgUrl,userId
        from diaryImgTB
                 join diaryTB on diaryTB.diaryId = diaryImgTB.diaryId
        where diaryImgTB.diaryImgId = ?
     `;
    const [userDiaryImgIdRow] = await connection.query(userDiaryImgIdQuery, diaryImgId);
    return userDiaryImgIdRow;
}

async function deleteMyColor(connection, userId) {
    const updateDiaryColorQuery = `
        DELETE FROM myColorTB WHERE userId = ?;
    `;
    const updateDiaryRow = await connection.query(updateDiaryColorQuery,userId);
    return updateDiaryRow;
}



async function resetMyColor(connection, userId) {
    const updateDiaryColorQuery = `
        Insert Into myColorTB (color, colorName,userId) 
                (select color, colorName,userId
                from (SELECT color,colorName,userId+? as userId FROM basicColorTB) a);
    `;
    const updateDiaryRow = await connection.query(updateDiaryColorQuery,userId);
    return updateDiaryRow;
}



// diaryId 에 맞는 컬러 변경
async function updateDiaryColor(connection, diaryId, color, colorName) {
    const updateDiaryColorQuery = `
        UPDATE diaryTB
        SET color = '${color}',
            colorName = '${colorName}'
        WHERE diaryId = ?;
    `;
    const updateDiaryRow = await connection.query(updateDiaryColorQuery,diaryId, color, colorName);
    return updateDiaryRow;
}

async function updateMyColor(connection,myColorId, color, colorName) {
    const updateDiaryColorQuery = `
        UPDATE myColorTB
        SET color = '${color}',
            colorName = '${colorName}'
        WHERE myColorId = ?;
    `;
    const updateDiaryRow = await connection.query(updateDiaryColorQuery,myColorId, color, colorName);
    return updateDiaryRow;
}



// diaryId 에 맞는 컬러 변경
async function updateDiary(connection, diaryId, content, recordContent,color,colorName) {
    const updateDiaryQuery = `
        UPDATE diaryTB
        SET content = '${content}',
            recordContent = '${recordContent}',
            color = '${color}',
            colorName = '${colorName}'
        WHERE diaryId = ?;
    `;
    const updateDiaryRow = await connection.query(updateDiaryQuery,diaryId, content, recordContent,color,colorName);
    return updateDiaryRow;
}

// isFulled 체크 -- content 값이 채워졌을 경우 변경
async function updateIsFulled(connection, diaryId) {
    const updateDiaryIsFulledQuery = `
        UPDATE diaryTB
        SET isFulled = 'Y'
        WHERE diaryId = ?;
    `;
    const updateIsFulled = await connection.query(updateDiaryIsFulledQuery,diaryId);
    return updateIsFulled;
}

async function updateDiaryImg(connection, diaryImgId, diaryImgUrl) {
    const updateDiaryImgQuery = `
        UPDATE diaryImgTB
        SET diaryImgUrl = REPLACE(diaryImgUrl, diaryImgUrl, '${diaryImgUrl}')
        where diaryImgId = ${diaryImgId};
    `;
    const updateDiaryRow = await connection.query(updateDiaryImgQuery,diaryImgId, diaryImgUrl);
    return updateDiaryRow;
}

async function withdrawMyColor(connection, myColorId) {
    const updateDiaryImgQuery = `
        UPDATE myColorTB SET color = null, colorName = null 
        where myColorId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryImgQuery,myColorId);
    return updateDiaryRow;
}

async function withdrawSelectContent(connection, diaryId) {
    const updateDiaryQuery = `
        UPDATE diaryTB SET content = null
        where diaryId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryQuery,diaryId);
    return updateDiaryRow;
}


async function withdrawSelectRecordContent(connection, diaryId) {
    const updateDiaryQuery = `
        UPDATE diaryTB SET recordContent = null
        where diaryId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryQuery,diaryId);
    return updateDiaryRow;
}


async function withdrawSelectColorName(connection, diaryId) {
    const updateDiaryQuery = `
        UPDATE diaryTB SET colorName = null
        where diaryId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryQuery,diaryId);
    return updateDiaryRow;
}

async function withdrawSelectImg(connection, diaryImgId) {
    const updateDiaryQuery = `
        DELETE FROM diaryImgTB
        where diaryImgId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryQuery,diaryImgId);
    return updateDiaryRow;
}



async function withdrawDiaryImg(connection, diaryId) {
    const updateDiaryImgQuery = `
        DELETE FROM diaryImgTB WHERE diaryId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryImgQuery,diaryId);
    return updateDiaryRow;
}

async function withdrawDiary(connection, diaryId) {
    const updateDiaryImgQuery = `
        DELETE FROM diaryTB WHERE diaryId = ? ;
    `;
    const updateDiaryRow = await connection.query(updateDiaryImgQuery,diaryId);
    return updateDiaryRow;
}



// dateId Check
async function dateIdCheck(connection, dateId, userId) {
    const dateIdQuery = `
    select dateId
    from dateTB
    join userTB on userTB.userId = dateTB.userId
    where dateTB.dateId = ? and dateTB.userId = ?;
     `;
    const [dateIdRow] = await connection.query(dateIdQuery,  dateId, userId);
    return dateIdRow;
}

// date Check
async function dateCheck(connection,userId, date) {
    const HomeDiaryQuery = `
    select color,       
           case
         when userTB.NameStatus = 'N'
             then null
         else colorName
        end as 'colorName'
    from dateTB
    where userId = ? and date = ?
     `;
    const [HomeDiaryRow] = await connection.query(HomeDiaryQuery, userId, date);
    return HomeDiaryRow;
}


// 제일 마지막 다이어리 인덱스 번호 확인
async function lastDiaryColumCheck(connection) {
    const HomeDiaryQuery = `
    select diaryId
    from diaryTB
    order by diaryId DESC
    limit 1
     `;
    const [HomeDiaryRow] = await connection.query(HomeDiaryQuery);
    return HomeDiaryRow;
}

// 제일 마지막 다이어리 이미지 인덱스 번호 확인
async function lastDiaryImgColumCheck(connection) {
    const HomeDiaryQuery = `
    select diaryImgId
    from diaryImgTB
    order by diaryImgId DESC
    limit 1
     `;
    const [HomeDiaryRow] = await connection.query(HomeDiaryQuery);
    return HomeDiaryRow;
}






// date view
async function selectHomeDiary(connection,userId, date) {
    const HomeDiaryQuery = `
    select color, colorName, nickname
    from diaryTB
    join userTB on userTB.userId = diaryTB.userId
    where userTB.userId = ? AND diaryTB.date = ?;
     `;
    const [HomeDiaryRow] = await connection.query(HomeDiaryQuery, userId, date);
    return HomeDiaryRow;
}

// 홈컬러 추가
async function insertTodayColor(connection, userId, color, colorName) {
    const insertColorQuery = `
        INSERT INTO diaryTB(userId, color, colorName,date)
        VALUES (${userId}, '${color}', '${colorName}', DATE_FORMAT(CURDATE(), "%Y-%m-%d"));
                `;
    const insertColorRow = await connection.query(insertColorQuery, userId, color, colorName);

    return insertColorRow;
};

// 다이어리 추가
async function insertDiaryInfo(connection, insertDiaryInfoParams) {
    const insertDiaryInfoQuery = `
        INSERT INTO diaryTB(userId, content, recordContent,color,colorName,date, isManyImg )
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const insertDiaryInfoRow = await connection.query(
        insertDiaryInfoQuery,
        insertDiaryInfoParams
    );

    return insertDiaryInfoRow;
}

// 다이어리 이미지 추가
async function insertDiaryImgUrl(connection, insertDiaryImgParams) {
    const insertDiaryImgQuery = `
                INSERT INTO diaryImgTB(diaryId, diaryImgUrl)
                VALUES (?, ?);
                `;
    const insertDiaryImgResult = await connection.query(insertDiaryImgQuery, insertDiaryImgParams);

    return insertDiaryImgResult;
};



// 이미지 조회
async function selectDiaryImg(connection, diaryId) {
    const selectDiaryImgQuery = `
                SELECT diaryImgUrl
                FROM diaryImgTB
                JOIN diaryTB on diaryTB.diaryId = diaryImgTB.diaryId
                WHERE diaryImgTB.diaryId = ?;
                `;
    const [diaryImgRows] = await connection.query(selectDiaryImgQuery, diaryId);

    return diaryImgRows;
};


async function checkDiary(connection, userId, date) {
    const checkArticleQuery = `
        SELECT userId, contents
        FROM diaryTB
        WHERE userId = ? and date = ? ;
    `;

    const checkArticleResult = await connection.query(
        checkArticleQuery,
        userId
    );

    return checkArticleResult[0];
}


module.exports = {
    selectUserId,
    checkDiary,
    selectDiaryImg,
    selectDiary,
    insertTodayColor,
    selectHomeDiary,
    dateCheck,
    dateIdCheck,
    updateDiaryColor,
    updateDiary,
    selectUserHistory,
    selectDiaryDate,
    selectTodayDiary,
    selectDiaryId,
    selectCurrentMonthDiary,
    selectBookMarkMonthDiary,
    insertDiaryInfo,
    updateIsFulled,
    insertDiaryImgUrl,
    selectDiaryStatus,
    selectDiaryImgId,
    updateDiaryImg,
    selectMonthDiary,
    lastDiaryColumCheck,
    selectBasicColor,
    lastDiaryImgColumCheck,
    selectHomeColorView,
    selectMyColorIdCheck,
    updateMyColor,
    withdrawMyColor,
    selectMyColor,
    selectMyColorId,
    selectMyColorIdCheckByMyColorId,
    deleteMyColor,
    resetMyColor,
    selectMyMostColor,
    withdrawDiaryImg,
    withdrawDiary,
    selectBookMarkTargetMonthDiary,
    selectNewMyMostColor,
    withdrawSelectContent,
    withdrawSelectRecordContent,
    withdrawSelectColorName,
    withdrawSelectImg

};