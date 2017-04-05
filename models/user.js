var mongodb = require('./db')

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = User;
/**
 * 保存用户信息
 */
User.prototype.save = function(callback) {
    // 存入数据库的用户文档
    var user = {
            name: this.name,
            password: this.password,
            email: this.email,
        }
        // 打开数据库
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);

        }
        // 读取users集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err)
            }
            // 用户的数据插入users集合
            collection.insert(user, {
                safe: true
            }, function(err, user) {
                mongodb.close()
                if (err) return callback(err)
                    // 成功，err为null，并返回存储后的用户文档
                callback(null, user[0])
            })
        })
    })
};
/**
 * 读取用户信息
 */
User.get = function(name, callback) {
    mongodb.open(function(err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        // 读取users集合
        db.collection('users', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err)
            }
            // 查找用户名值为name的一个文档
            collection.findOne({
                name: name
            }, function(err, user) {
                mongodb.close();
                if (err) return callback(err);
                // 成功，err为null，并返回查询的用户信息
                callback(null, user);
            })
        })
    })
};
