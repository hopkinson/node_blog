var mongodb = require('./db');
var markdown=require('markdown').markdown;
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
                post: this.post
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
Post.get = function(name, callback) {
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
                callback(null, docs);
            })
        })
    })
};
