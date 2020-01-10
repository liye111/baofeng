//引入mongoose
let mongoose = require('mongoose');



//***注意：通过mongoose操作mongodb数据库时，mongoose会自动对
//         表名加s或es
//定义通过mongoose操作mongodb数据库的类
class Mongooses {

    constructor(host, dbname, port) {
        this.tableModel = {}; //存放创建的表Model模型
        this.model = {}; //当前表的Model模型
        mongoose.connect(`mongodb://${host}:${port}/${dbname}`, { useUnifiedTopology: true, useNewUrlParser: true });
        //获取所有表定义及数据约束
        this.table = require('./tables.json');
    }

    //类中放属性及方法

    //定义Schema及创建Model模型
    getModels(tname) {
        this.model = this.tableModel[tname];
        if (!this.model) { // 当前表的Model不存在
            //创建Schema
            let schema = new mongoose.Schema(this.table[tname]);

            // console.log('testing...');
            //根据Schema创建Model模型
            this.model = mongoose.model(tname, schema);
            //将已创建的Model存放this.tableModel
            this.tableModel[tname] = this.model;
        }
    }

    //添加数据
    /**
     * 
     * @param String tables  表名
     * @param Object fields  要添加的数据
     * @param Function callback  回调函数
     */
    add(tables, fields, callback) {
        this.getModels(tables);
        this.model.create(fields, (err) => {
            callback(err);
        });
    }

    //查询数据
    /**
     * 
     * @param String tname  表名
     * @param Object cond   查询条件
     * @param Object fields   要显示的属性
     * @param Object sortlimit   选项：可以使用limit、skip、sort
     * @param Function callback  回调函数
     */
    search(tname, cond, fields, sortlimit, callback) {
        this.getModels(tname); //创建当前表的Model模型

        this.model.find(cond, fields, sortlimit, (err, data) => {
            callback(err, data)
        });
    }

    //根据条件查询数量
    searchCount(tname, cond, callback) {
        this.getModels(tname); //创建当前表的Model模型
        this.model.countDocuments(cond, (err, num) => {
            callback(err, num);
        });
    }
    //修改数据
    /**
     * 
     * @param String tname 表名
     * @param Object cond  条件
     * @param Object fields  修改后的对象
     * @param Function callback 回调函数
     */
    modify(tname, cond, fields, callback) {
        this.getModels(tname);
        this.model.update(cond, fields, { multi: true }, (err, data) => {
            callback(err, data);
        });
    }

    //删除数据
    del(tname,cond,callback) {
        this.getModels(tname);
        this.model.deleteMany(cond, (err) => {
            callback(err);
        });
    }

}

module.exports = new Mongooses("localhost", "baofeng", 27017);