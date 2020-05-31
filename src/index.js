//------------require-----------//
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const app = express();

const upload = multer({
    dest: 'tmp_uploads'
});

//------------set-----------//
app.set('view engine', 'ejs');

//------------use-----------//

//Top-level Middleware
// 解析 post urlencoded 的 middleware
app.use(express.urlencoded({
    extended: false
}));
// 解析 json 的 middleware
app.use(express.json());

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'm061i6',
    cookie: {
        maxAge: 1200000
    }
}));
app.use((req, res, next)=>{
    res.locals.pageName = '';
    req.query.from_middleware = 'hello';
    if(req.session.admins && req.session.admins.account){
        res.locals.admins = req.session.admins;
    }
    next();
});

app.use('/address-book', require(__dirname + '/address-book.js'));
app.use('/project', require(__dirname + '/project.js'));



//------------get-----------//
const db = require(__dirname + '/__connect_db.js');


app.get('/', (req, res) => {
    res.render('home', {
        name: 'hello world'
    });
});


//middleware
// const urlencodedParser = express.urlencoded({extended: false});
app.post('/try-upload', upload.single('avatar'), (req, res) => {
    let ext = '';
    switch (req.file.mimetype) {
        case 'image/png':
            ext = '.png';
            break;
        case 'image/jpeg':
            ext = '.jpg';
            break;
    }
    if (ext) {
        let filename = (new Date().getTime()) + ext;
        fs.rename(
            req.file.path,
            './public/img/' + filename,
            error => {
                res.json({
                    success: true,
                    img: '/img/' + filename,
                    body: req.body
                });
            }
        )
    } else {
        fs.unlink(res.file.path, error => {
            res.json({
                success: false,
                info: 'wrong file type'
            });
        });
    }
});

app.get('/json', (req, res) => {
    const data = require(__dirname + '/../data/sales.json');
    //res.send(data);
    res.render('sales', {
        sales: data
    });
});

app.get(/^\/mobile\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
    let u = req.url.slice(8).split('?')[0];
    let m = u.split('-').join('');
    res.json({
        'url': req.url,
        'mobile': m
    });
});

app.get('/try-session', (req, res) => {
    req.session.my_var = req.session.my_var || 0
    req.session.my_var++;
    res.json({
        my_var : req.session.my_var,
        session : req.session
    })
});
app.get('/try-db', (req, res) => {
   let sql = "SELECT * FROM `view_viewpoint` ORDER BY `auto_id`";
   db.query(sql, (error , result , fields)=>{
        console.log(fields);
        res.json(result);
   });
});

app.use(express.static('public')); //設定server根目錄為public

app.use((req, res) => {
    res.type('text/html');
    res.status(404);
    res.send(`
        <h2>Page not Found !!!</h2>
    `);
});
app.listen(3000, () => {
    console.log('server started!');
});