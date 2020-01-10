const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require("fs");
const svgCaptcha = require('svg-captcha');//引入验证码
const crypto = require('crypto');//加密模块
const uuidv1 = require("uuid/v1");//产生唯一的随机字符串
var formidable = require('formidable');//处理文件上传
//引入操作mongodb数据库类
const dbObj = require('../db/mongoose-class.js');

//设计路由

// 显示 热映电影
router.get('/hot', (req, res) => {
    //接收参数
     let curtitle = req.query.title;
    let conds = {};

    if(curtitle) { //用户输入的要查询的关键字
        conds.title =new RegExp(curtitle);  //模糊查询

    }
    //第几页
    let curPage = req.query.page ? req.query.page : 1;

    //每页只显示2条
    let curlimit = 2;
    //查询推荐电影总数量
    dbObj.searchCount("hot-movie", {}, (err, total) => {
        //计算页数
        // console.log(total);
        let totalPage = Math.ceil(total / curlimit);

        //计算skip值
        let curSkip = (curPage - 1) * curlimit;

        //读取推荐电影数据
        dbObj.search('hot-movie', conds, {}, { limit: curlimit, skip: curSkip }, (err, data) => {
            res.render('admin/hotlist.html', { curPage, data, totalPage, total });
        });
    })



});

//添加 热映电影
router.get("/hotadd", (req, res) => {
    res.render("admin/hotadd.html");
});
//处理 添加 热映电影
router.post("/hotadd", (req, res) => {
    var fullPath = path.resolve(__dirname, "../uploads");
    var form = new formidable.IncomingForm();
    //更改上传成功后生成临时文件存放位置
    form.uploadDir = fullPath;
    form.parse(req, function (err, fields, files) {
        if (files.img.name != "") {
            // console.log(err, fields, files);//fields是出上传文件表单项的所有表单项 所以可以不用req.body
            let fName = files.img.name;
            let fArr = fName.split(".");
            let extName = fArr[fArr.length - 1];


            // //生成文件的完整文件名
            let fullName = `${uuidv1()}.${extName}`;

            // //将上传成功生成的临时文件改为正式文件
            fs.renameSync(files.img.path, `${fullPath}/${fullName}`);

            fields.img = `../uploads/${fullName}`;
        }


        dbObj.add('hot-movie', fields, (error) => {
            if (error) { //添加失败
                res.send("<script>alert('添加失败');location.href='/hotadd';</script>");
            } else { //添加成功
                res.send("<script>alert('添加成功');location.href='/hot';</script>");
            }
        });

    })
})

//生成验证码
router.get("/getcode", (req, res) => {
    let captcha = svgCaptcha.create({
        size: 4,       //验证码的字符长度
        noise: 1,      //干扰线的个数
        color: true,   //验证码的字符颜色
        background: '#CCFFFF' //验证码背景颜色
    });
    //保存生成的验证码
    req.session.CODECHA = captcha.text;

    res.setHeader('content-type', 'image/svg+xml');
    res.send(captcha.data);
})


//后台用户登录界面
router.get('/logins', (req, res) => {
    //动作标识 用来判断用户是否退出系统
    let curAct = req.query.act;

    if (curAct == "logot") {
        delete req.session.CURUSR;
    }

    res.render('admin/login.html');
});
//处理 后台用户登录
router.post('/logins', (req, res) => {
    //获取生成的验证码
    let curCode = req.session.CODECHA;
    //接收参数
    let { usr, pwd, regcode } = req.body;

    //判断验证码是否正确
    if (regcode.toLowerCase() != curCode.toLowerCase()) {
        res.render("admin/404.html", { "tip": "验证码不正确", "url": "/logins" });
        return false;
    }


    //对用户输入的密码进行加密
    const secret = '321!@#$abcd'; //密钥
    pwd = crypto.createHmac('sha256', secret)
        .update(pwd)
        .digest('hex');

    //查询用户
    dbObj.search('adminuser', { "uname": usr }, {}, {}, (err, updata) => {
        //判断密码是否正确
        console.log(updata);
        if (updata.length == 1) {//账号正确
            //判断密码是否正确
            if (pwd == updata[0].pwd) {//密码正确
                //设置session
                req.session.CURUSR = usr;
                res.render("admin/404.html", { "tip": "密码正确", "url": "/main" });

            } else {//密码错误
                res.render("admin/404.html", { "tip": "密码不正确", "url": "/logins" })

            }
        } else {//账号不正确
            res.render("admin/404.html", { "tip": "账号不正确", "url": "/logins" });

        }
    })


})

//显示删除电影列表
router.get("/recmoviedel", (req, res) => {

    //要删除的电影id
    let ids = req.query.curid;
    dbObj.del("removie", { _id: ids }, (error) => {

        if (error) {//删除失败  
            res.send({ "flag": false, "msg": "删除失败" });//返回的是json数据
        } else {//删除成功 
            res.send({ "flag": true, "msg": "删除成功" });//返回的是json数据 客户端拿到的是json数据 就可以用了
        }
    })

})


//推荐电影列表
router.get('/recmovielist', (req, res) => {
    //接收参数
     let curtitle = req.query.title;
    let conds = {};

    if(curtitle) { //用户输入的要查询的关键字
        conds.title =new RegExp(curtitle);  //模糊查询

    }
    //第几页
    let curPage = req.query.page ? req.query.page : 1;

    //每页只显示2条
    let curlimit = 2;
    //查询推荐电影总数量
    dbObj.searchCount("removie", {}, (err, total) => {
        //计算页数
        // console.log(total);
        let totalPage = Math.ceil(total / curlimit);

        //计算skip值
        let curSkip = (curPage - 1) * curlimit;

        //读取推荐电影数据
        dbObj.search('removie', conds, {}, { limit: curlimit, skip: curSkip }, (err, data) => {
            res.render('admin/recmovie_list.html', { curPage, data, totalPage, total });
        });
    })



});

//添加推荐电影
router.get("/recmovieadd", (req, res) => {
    res.render("admin/recmovieadd.html");
});


//处理 添加推荐电影
router.post("/recmovieadd", (req, res) => {
    var fullPath = path.resolve(__dirname, "../uploads");
    var form = new formidable.IncomingForm();
    //更改上传成功后生成临时文件存放位置
    form.uploadDir = fullPath;
    form.parse(req, function (err, fields, files) {
        if (files.img.name != "") {
            // console.log(err, fields, files);//fields是出上传文件表单项的所有表单项 所以可以不用req.body
            let fName = files.img.name;
            let fArr = fName.split(".");
            let extName = fArr[fArr.length - 1];


            // //生成文件的完整文件名
            let fullName = `${uuidv1()}.${extName}`;

            // //将上传成功生成的临时文件改为正式文件
            fs.renameSync(files.img.path, `${fullPath}/${fullName}`);

            fields.img = `../uploads/${fullName}`;
        }


        dbObj.add('removie', fields, (error) => {
            if (error) { //添加失败
                res.send("<script>alert('添加失败');location.href='/recmovieadd';</script>");
            } else { //添加成功
                res.send("<script>alert('添加成功');location.href='/recmovielist';</script>");
            }
        });

    })
})

//用户列表显示
router.get("/song", (req, res) => {

    //第几页
    let curPage = req.query.page ? req.query.page : 1;

    //每页只显示2条
    let curlimit = 2;
    //查询推荐电影总数量
    dbObj.searchCount("adminuser", {}, (err, total) => {
        //计算页数
        // console.log(total);
        let totalPage = Math.ceil(total / curlimit);

        //计算skip值
        let curSkip = (curPage - 1) * curlimit;

        //读取推荐电影数据
        dbObj.search('adminuser', {}, {}, { limit: curlimit, skip: curSkip }, (err, data) => {
            res.render('admin/song.html', { curPage, data, totalPage, total });
        });
    })

})

//添加用户列表
router.get('/songadd', (req, res) => {
    res.render("admin/song-add.html")
})

//处理 用户列表
router.post("/songadd", (req, res) => {
    var fullPath = path.resolve(__dirname, "../uploads");
    var form = new formidable.IncomingForm();
    //  更改上传成功后生成临时文件存放位置
    form.uploadDir = fullPath;
    form.parse(req, function (err, fields, files) {
  
        dbObj.add('adminuser', fields, (error) => {
            if (error) { //添加失败
                res.send("<script>alert('添加失败');location.href='/songadd';</script>");
            } else { //添加成功
                res.send("<script>alert('添加成功');location.href='/song';</script>");
            }
        });

    })
})

//修改显示电影界面 先显示
router.get("/recmovieupdate", (req, res) => {

    //接收参数（要修改电影的id）
    let curid = req.query.id;

    //根据要修改的电影id查询当前电影数据
    dbObj.search("removie", { _id: curid }, {}, {}, (err, mdata) => {
        res.render("admin/recmovie_update.html", { mdata });
    });

});
//处理 修改显示电影界面 后修改
router.post("/recmovieupdate", (req, res) => {

    var form = new formidable.IncomingForm();
    var fullPath = path.resolve(__dirname, "../uploads");

    //更改上传成功后生成临时文件存放位置
    form.uploadDir = fullPath;
    form.parse(req, function (err, fields, files) {
        if (files.img.name != "") {
            // console.log(err, fields, files);//fields是出上传文件表单项的所有表单项 所以可以不用req.body
            let fName = files.img.name;
            let fArr = fName.split(".");
            let extName = fArr[fArr.length - 1];

            // //生成文件的完整文件名
            let fullName = `${uuidv1()}.${extName}`;

            // //将上传成功生成的临时文件改为正式文件
            fs.renameSync(files.img.path, `${fullPath}/${fullName}`);

            fields.img = `../uploads/${fullName}`;
        }
        console.log(err, fields, files)
        //修改推荐电影数据
        dbObj.modify('removie', { _id: fields._id }, { $set: fields }, (err, data) => {
            if (err) { //修改失败
                res.render('admin/404.html', { "tip": "修改失败", "url": "/recmovieupdate" });
            } else { //修改成功
                res.render('admin/404.html', { "tip": "修改成功", "url": "/recmovielist" });
            }
        });
    })

})
//后台主界面
router.get('/main', (req, res) => {

    res.render('admin/main.html');
});

//顶部界面
router.get('/top', (req, res) => {
    //获取session
    let curuser = req.session.CURUSR;
    res.render('admin/top.html', { curuser });
});

//左部界面
router.get('/left', (req, res) => {

    res.render('admin/left.html');
});


//右部界面
router.get('/right', (req, res) => {

    res.render('admin/right.html');
});

module.exports = router;