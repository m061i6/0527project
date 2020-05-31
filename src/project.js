const express = require('express');
const moment = require('moment-timezone')
const db = require(__dirname + '/__connect_db.js');
const router = express.Router();

router.use((req, res, next) => {
    res.locals.title = '2019年國家公園每月人數統計';
    next();
});

router.get('/list/:page?', (req, res) => {
    res.locals.title = '列表 - 國家公園';
    res.locals.pageName = 'list';
    let totalRows = 0;
    let perPage = 10;
    let page = req.params.page ? parseInt(req.params.page) : 1;

    let sql = "SELECT COUNT(1) as num FROM `view_viewpoint`";
    db.query(sql, (error, result, fields) => {
        let totalRows = result[0].num;
        let totalPages = Math.ceil(result[0].num / perPage);
        if (totalRows == 0) {
            res.send('<h2>No Data</h2>');
            return;
        }
        if (page < 1) {
            res.redirect('/project/list/1');
            return;
        }
        if (page > totalPages) {
            res.redirect('/project/list/' + totalPages);
            return;
        }
        const sql = `SELECT * FROM view_viewpoint ORDER BY auto_id asc LIMIT ${(page-1)*perPage}, ${perPage}`;
        db.query(sql, (error, results) => {
            res.render('project/list', {
                totalRows: totalRows,
                page: page,
                totalPages: totalPages,
                rows: results
            });
        });

    });
})
router.get('/login/', (req, res) => {
    res.locals.title = '登入 - 國家公園';
    res.locals.pageName = 'login';
    res.render('project/login');
});
router.get('/resnet/', (req, res) => {
    res.locals.title = '影像辨識';
    res.locals.pageName = 'resnet';
    res.render('project/resnet');
});
router.get('/luis/', (req, res) => {
    res.locals.title = '語句分析';
    res.locals.pageName = 'luis';
    res.render('project/luis');
});
router.get('/chart/', (req, res) => {
    res.locals.title = '造訪人次 - 國家公園';
    res.locals.pageName = 'chart';
    res.render('project/chart');
});
router.get('/getdata/:vid?', (req, res) => {
    const output = {};
    let sql = "SELECT * FROM `view_viewpoint` WHERE `auto_id` = ? LIMIT 1";
    db.queryAsync(sql, [req.params.vid])
        .then(results => {
            if (results) {
                output.viewpoint = results;
                let sql2 = "SELECT `month`,`visitors` FROM `visitors` WHERE `v_id` = ? ORDER BY `month`";
                db.queryAsync(sql2, [req.params.vid])
                .then(results => {
                    if (results) {
                        output.visitors = results;
                        output.success = true;
                        res.json(output);
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
                // res.json({
                //     success: true,
                //     results: results
                // });
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
 router.get('/getArea', (req, res) => {
    let sql = "SELECT * FROM `area` order by `area_id`";
    db.queryAsync(sql)
        .then(results => {
            if (results) {
                res.json({
                    success: true,
                    area: results
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
 router.get('/getViewpoint/:aid?', (req, res) => {
    let sql = "SELECT `auto_id`,`name` FROM `view_viewpoint` WHERE `area_id` = ? order by `auto_id`";
    db.queryAsync(sql,[req.params.aid])
        .then(results => {
            if (results) {
                res.json({
                    success: true,
                    viewpoint: results
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
    res.redirect('/project/login');
});
module.exports = router;