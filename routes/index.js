var express = require('express');
var router = express.Router();
var User = require('../models/user.js');
var Post = require('../models/post.js');
// ======
// 生成散列值来加密密码
var crypto = require('crypto');
// ======

/* GET home page. */
module.exports = function(app) {
    app.get('/', function(req, res) {
        Post.get(null, function(err, posts) {
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
    app.post('/upload', checkLogin);
    app.post('/upload', function(req, res) {
        if (err) {
            req.flash('error', "err");
            res.redirect('/');
        }
        req.flash('success', "图片上传成功");
        res.redirect('/upload');
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
