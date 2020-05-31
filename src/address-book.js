const express = require('express');
const moment = require('moment-timezone')
const db = require(__dirname + '/__connect_db.js');
const router = express.Router();

router.use((req, res, next) => {
    res.locals.title = '通訊錄';
    next();
});


router.get('/add', (req, res) => {
    res.locals.title = '新增資料 - 通訊錄';
    res.locals.pageName = 'ab-add';
    res.render('address-book/add');
});
router.get('/del/:sid', (req, res) => {
    const sql = "UPDATE `address_book` SET `is_delete` = 1 WHERE `sid` = ?";
    // 通常不直接刪除而是從其中一個欄位去標記資料已刪除
    // const sql = "DELETE FROM `address_book` WHERE `address_book`.`sid` = ?";
    db.query(sql,
        [req.params.sid],
        (error, results) => {
            if (error) {
                console.log('err:' + err);
            }
            console.log('del:', results);
            res.redirect(req.header('Referer')); // 回到原來的頁面
        });

});
router.get('/fake', (req, res) => {
    return res.send('off');
    const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?,NOW())";
    // 建議用此種方式送資料以避免SQL Injection
    for (let i = 0; i < 100; i++) {
        let mobile = '09' + Math.floor(Math.random() * 100000000);
        // let email = new Date().getTime().toString(16) + Math.floor(Math.random()*1000) + '@gmail.com';
        db.query(sql, [
            '陳小華' + i,
            mobile + '@gmail.com',
            mobile,
            '1990-11-12',
            '台北市',
        ]);
        if (i == 99) {
            res.send('ok');
        }
    }

});
router.post('/add', (req, res) => {
    // TODO: 檢查資料格式是否有誤
    const output = {
        success: false,
        postData: req.body,
        text: '',
        alertType: ''
    }
    const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?,NOW());"
    // 建議用此種方式送資料以避免SQL Injection
    db.query(sql, [
        req.body.name,
        req.body.email,
        req.body.mobile,
        req.body.birthday,
        req.body.address
    ], (error, results) => {
        if (error) {
            console.log(error);
            output.error = error;
            output.alertType = 'danger';
            output.text = '新增失敗';
        } else {
            output.success = true;
            output.results = results;
            output.alertType = 'success';
            output.text = '新增成功';
        }
        res.json(output);
    })
});

router.get('/list/:page?', (req, res) => {
    res.locals.title = '列表 - 通訊錄';
    res.locals.pageName = 'ab-list';
    let totalRows = 0;
    let perPage = 5;
    let page = req.params.page ? parseInt(req.params.page) : 1;

    let sql = "SELECT COUNT(1) as num FROM `address_book` WHERE `is_delete` = '0'";
    db.query(sql, (error, result, fields) => {
        let totalRows = result[0].num;
        let totalPages = Math.ceil(result[0].num / perPage);
        if (totalRows == 0) {
            res.send('<h2>No Data</h2>');
            return;
        }
        if (page < 1) {
            res.redirect('/address-book/list/1');
            return;
        }
        if (page > totalPages) {
            res.redirect('/address-book/list/' + totalPages);
            return;
        }
        const sql = `SELECT * FROM address_book WHERE is_delete = 0 ORDER BY sid DESC LIMIT ${(page-1)*perPage}, ${perPage}`;
        db.query(sql, (error, results) => {
            const fm = 'YYYY-MM-DD';
            results.forEach((el) => {
                el.birthday = moment(el.birthday).format(fm);
            });
            // res.json({
            //     totalRows: totalRows,
            //     page: page,
            //     totalPages: totalPages,
            //     rows: results
            // });
            res.render('address-book/list', {
                totalRows: totalRows,
                page: page,
                totalPages: totalPages,
                rows: results

            });
        });

    });


})
router.get('/login/', (req, res) => {
    res.locals.title = '登入 - 通訊錄';
    res.locals.pageName = 'ab-login';
    res.render('address-book/login');
});
router.post('/login/', (req, res) => {
    const sql = "SELECT `sid`,`account`,`nickname` FROM `admins` WHERE `account`= ? AND `password`= SHA1(?) ";
    db.queryAsync(sql, [req.body.account, req.body.password])
        .then(results => {
            if (results && results.length === 1) {
                req.session.admins = results[0];
                res.json({
                    success: true,
                    admins: results[0]
                });
            } else {
                res.json({
                    success: false
                });
            }
        })
        .catch(error => {
            res.json({
                success: false,
                error: error
            });
        })
});
router.get('/logout/', (req, res) => {
    delete req.session.admins;
    res.redirect('/address-book/login');
});
router.get('/edit/:sid?', (req, res) => {
    res.locals.title = '編輯資料 - 通訊錄';
    res.locals.pageName = 'ab-edit';
    const sql = `SELECT * FROM address_book WHERE is_delete = 0 AND sid = ?`;
    db.query(sql, [req.params.sid], (error, results) => {
        if (results && results.length === 1) {
            // res.json(results);
            results[0].birthday = moment(results[0].birthday).format('YYYY-MM-DD');
            res.render('address-book/edit', {
                row: results[0]
            });
        } else {
            return res.redirect('/address-book/list');
        }
    });
})
router.post('/edit/:sid', async (req, res) => {
    // TODO: 可以先判斷資料是否符合規則
    const output = {
        success: false,
        info: '',
        postData: req.body,
        alertType: '',
    };
    const s_sql = "SELECT * FROM `address_book` WHERE `is_delete` = 0 AND email=? AND sid <> ? ";
    let r1;
    try {
        r1 = await db.queryAsync(s_sql, [req.body.email, req.params.sid]);
    } catch (error) {
        console.log(error);
        output.error = error;
        output.alertType = 'danger';
        output.info = '編輯失敗';
        res.json(output);
    }
    if (r1.length) {
        output.info = 'Email 資料重複';
        output.alertType = 'warning';
        return res.json(output);
    }
    const sql = "UPDATE `address_book` SET ? WHERE sid=?";
    let r2;
    try {
        r2 = await db.queryAsync(sql, [req.body, req.params.sid]);
        if (r2.changedRows === 1) {
            output.info = '編輯成功';
            output.success = true;
            output.alertType = 'success';
        } else {
            output.info = '資料沒有變更';
            output.alertType = 'warning';
        }
        res.json(output);
    } catch (error) {
        console.log(error);
        output.error = error;
        output.alertType = 'danger';
        output.info = '編輯失敗';
        res.json(output);
    }
});
// 新版post 採用bluebird的promise
// router.post('/edit_old2/:sid', (req, res) => {
//     // TODO: 檢查資料格式是否有誤
//     const output = {
//         success: false,
//         postData: req.body,
//         alertType: '',
//         info: ''
//     }
//     const check_sql = "SELECT * FROM `address_book` WHERE `is_delete` = 0 AND `email` = ? AND `sid` <> ?";
//     db.queryAsync(check_sql, [req.body.email, req.params.sid])
//         .then(results => {
//             if (results.length) {
//                 output.info = 'Email 資料重複';
//                 output.alertType = 'warning';
//                 res.json(output);
//             } else {
//                 const sql = "UPDATE `address_book` SET ? WHERE sid=?";
//                 return db.queryAsync(sql, [req.body, req.params.sid]);
//             }
//         })
//         .then(results => {
//             if(!results) return;
//             if (results.changedRows === 1) {
//                 output.info = '編輯成功';
//                 output.success = true;
//                 output.alertType = 'success';
//             } else {
//                 output.alertType = 'warning';
//                 output.info = '資料沒有變更';
//             }
//             res.json(output);
//         })
//         .catch(error => {
//             console.log(error);
//             output.error = error;
//             output.alertType = 'danger';
//             output.info = '編輯失敗';
//             res.json(output);
//         })
// });
// 舊版post 會有縮排地獄
// router.post('/edit/:sid', (req, res) => {
//     // TODO: 檢查資料格式是否有誤
//     const output = {
//         success: false,
//         postData: req.body,
//         info: '',
//     }
//     const check_sql = "SELECT * FROM `address_book` WHERE `is_delete` = 0 AND `email` = ? AND `sid` <> ?";
//     db.query(check_sql, [req.body.email, req.params.sid], (error, results) => {
//         if (results.length) {
//             output.info = 'Email 資料重複';
//             output.alertType = 'warning';
//             res.json(output);
//         } else {
//             const sql = "UPDATE `address_book` SET ? WHERE sid=?";
//             // // 建議用此種方式送資料以避免SQL Injection
//             db.query(sql, [
//                 req.body, req.params.sid
//             ], (error, results) => {
//                 if (error) {
//                     console.log(error);
//                     output.error = error;
//                     output.alertType = 'danger';
//                     output.info = '編輯失敗';
//                 } else {
//                     if (results.changedRows === 1) {
//                         output.info = '編輯成功';
//                         output.success = true;
//                         output.alertType = 'success';
//                     } else {
//                         output.alertType = 'warning';
//                         output.info = '資料沒有變更';
//                     }
//                     output.results = results;
//                 }
//                 res.json(output);
//             });
//         }
//     });
// });
module.exports = router;