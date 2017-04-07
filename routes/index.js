var express = require('express');
var router = express.Router();
// =============
// 上传文件
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/images/')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage });
// =============
// model
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
// ======
// 生成散列值来加密密码
var crypto = require('crypto');
// ======

/* GET home page. */
module.exports = function(app) {
    // ======
    // 主页
    app.get('/', function(req, res) {
        Post.getAll(null, function(err, posts) {
            if (err) {
                posts = []
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
            console.log(!!req.session.user)
        });
    });
    // ======
    // 注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function(req, res, next) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req, res) {
        var name = req.body.name;
        var password = req.body.password;
        var password_re = req.body['password-repeat'];
        // 检验密码是否一样
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/reg');
        }
        // 生成MD5的密码
        var md5 = crypto.createHash('md5');
        var pwd = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: pwd,
            email: req.body.email,
        });
        // 检查用户是否已经存在
        User.get(newUser.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/')
            }
            if (user) {
                req.flash('error', '用户名已经存在！');
                return res.redirect('/reg');
            }
            // 如果不存在的话新增用户
            newUser.save(function(err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg')
                }
                // 用户信息存入session
                req.session.user = user;
                req.flash('success', "注册成功");
                res.redirect('/');
            })
        })
    });
    // ======
    // 登录
    app.get('/login', checkNotLogin);
    app.get('/login', function(req, res, next) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res) {
        var md5 = crypto.createHash('md5');
        var pwd = md5.update(req.body.password).digest('hex');
        // 检查用户是否存在
        User.get(req.body.name, function(err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/login')
            }
            if (!user) {
                req.flash('error', "用户不存在");
                return res.redirect('/login')
            }
            if (user.password != pwd) {
                req.flash('error', "密码不正确");
                return res.redirect('/login')
            }
            req.session.user = user;
            req.flash('success', "登录成功");
            res.redirect('/');
        })
    });
    // =======
    // 发表
    app.get('/post', checkLogin);
    app.get('/post', function(req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function(req, res) {
        var currentuser = req.session.user,
            post = new Post(currentuser.name, req.body.title, req.body.post);
        post.save(function(err) {
            if (err) {
                req.flash('error', "err");
                res.redirect('/');
            }
            req.flash('success', "发布成功");
            res.redirect('/');
        })
    });
    // =======
    // 上传
    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res) {
        res.render('upload', {
            title: '上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    // 单图上传
    app.post('/upload', checkLogin);
    app.post('/upload', upload.single('file1'), function(req, res, next) {
        var file = req.file;
        req.flash('success', "图片上传成功");
        res.redirect('/');
    });


    // =======
    // 点击用户连接跳到用户博客下
    app.get('/u/:name', function(req, res) {
        User.get(req.params.name, function(err, user) {
            if (!user) {
                req.flash('error', err);
                res.redirect('/');
            }
            // 查询并返回该用户的所有文章
            Post.getAll(user.name, function(err, posts) {
                if (!user) {
                    req.flash('error', err);
                    res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            })
        })
    });
    // 获取某一篇文章
    app.get('/u/:name/:day/:title', function(req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err);
                res.redirect('/');
            }
            res.render('article', {
                title: req.params.name,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        })
    });
    // 编辑文章
    app.get('/edit/:name/:day/:title', checkLogin)
    app.get('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err);
                res.redirect('/');
            }
            res.render('edit', {
                title: "编辑",
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    });
    app.post('/edit/:name/:day/:title', checkLogin)
    app.post('/edit/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err, post) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title)
            if (err) {
                req.flash('error', err);
                res.redirect(url);
            }
            req.flash('success', '修改成功');
            res.redirect(url);
        })
    });
    // 删除
    app.get('/remove/:name/:day/:title', checkLogin)
    app.get('/remove/:name/:day/:title', function(req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功');
            res.redirect('/');
        })
    });
    // 引入留言
    app.post('/u/:name/:day/:title', checkLogin)
    app.post('/u/:name/:day/:title', function(req, res) {
        var data = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes(),
            comment = {
                name: req.body.name,
                time: time,
                email: req.body.email,
                website: req.body.website,
                content: req.body.content
            },
            newComment = new Comment(req.params.name, req.params.day, req.params.title);
        newComment.save(function(err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功');
            res.redirect('back');
        })
    });
    // ======
    // 登出
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', "登出成功");
        res.redirect('/login');
    });
}

//====================
function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录');
        res.redirect('/login')
    }
    next()
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登陆！');
        res.redirect('back')
    }
    next()
}
//====================
// module.exports = router;
