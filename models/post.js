var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;

/*
 *存储一篇文章及其信息
 */
Post.prototype.save = function(callback) {
        var date = new Date();
        // 存储各种时间格式，方便以后扩展
        var time = {
                date: date,
                year: date.getFullYear(),
                month: date.getFullYear() + '-' + (date.getMonth() + 1),
                day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + " " + date.getHours() + ":" + date.getMinutes(),
            }
            // 要存入数据库的文档
        var post = {
                time: time,
                name: this.name,
                title: this.title,
                post: this.post,
                comment: []
            }
            // 打开数据库
        mongodb.open(function(err, db) {
            if (err) {
                mongodb.close();
                return callback(err)
            }
            // 读取posts集合
            db.collection('posts', function(err, collection) {
                if (err) {
                    mongodb.close();
                    return callback(err)
                }
                // 将文档插入post集合
                collection.insert(post, { safe: true }, function(err) {
                    mongodb.close();
                    if (err) {
                        mongodb.close();
                        return callback(err);
                    }
                    callback(null);
                })
            })
        });
    }
    /**
     * 读取文章及其相关信息
     */
Post.getAll = function(name, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err)
        }
        // 读取users集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err)
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            // 根据query查询文章
            collection.find(query).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err)
                }
                docs.forEach(function(doc) {
                    doc.post = markdown.toHTML(doc.post)
                })
                callback(null, docs);

            })
        })
    })
};
/**
 * 获取一篇文章
 */
Post.getOne = function(name, day, title, callback) {
        mongodb.open(function(err, db) {
            if (err) {
                mongodb.close();
                return callback(err)
            }
            db.collection('posts', function(err, collection) {
                if (err) {
                    mongodb.close();
                    return callback(err)
                }
                collection.findOne({
                    name: name,
                    "time.day": day,
                    title: title
                }, function(err, doc) {
                    mongodb.close();
                    if (err) {
                        return callback(err)
                    }
                    // doc.post = markdown.toHTML(doc.post)
                    if (doc) {
                        //  文章
                        doc.post = markdown.toHTML(doc.post);
                        //  评论
                        doc.comments.forEach(function(comment) {
                            comment.content = markdown.toHTML(comment.content)
                        })
                    }
                    callback(null, doc)
                })
            })
        })
    }
    /**
     * 文章编辑
     */
Post.edit = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: name,
                "time.day": day,
                title: title
            }, function(err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err)
                }
                callback(null, doc)
            })
        })
    })
};
/**
 * 更新文章
 */
Post.update = function(name, day, title, post, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 更新文章内容
            collection.update({
                'name': name,
                'time.day': day,
                'title': title,
            }, {
                $set: { post: post }
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null)
            })
        })
    })
};
/**
 * 删除文章
 */
Post.remove = function(name, day, title, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 更新文章内容
            collection.remove({
                'name': name,
                'time.day': day,
                'title': title,
            }, {
                w: 1
            }, function(err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null)
            })
        })
    })
};
/**
 * 返回所有文章存档信息
 */
Post.getArchive = function(callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 返回只包含name,title,time属性的文档组成的存档数组
            collection.find({}, {
                "name": 1,
                "title": 1,
                "time": 1,
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs)
            })
        })
    })
}
