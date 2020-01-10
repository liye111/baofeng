var express = require('express');
const crypto = require('crypto');  //加密模块
var router = express.Router();
let dbObj = require("../db/mongoose-class.js");
/* GET home page. */
//读取首页数据
function getIndexData(callback) {
  //读取推荐电影数据
  let p1 = new Promise((resolved, rejected) => {
    dbObj.search("removie", {}, {}, { limit: 20 }, (err, datas) => {
      // console.log(datas);
      resolved(datas);
    });
  });
  let p2 = new Promise((resolved, rejected) => {
    dbObj.search("hot-movie", {}, {}, { limit: 20 }, (err, datas) => {
      // console.log(datas);
      resolved(datas);
    });
  });
  let prmObj = Promise.all([p1, p2]);
  prmObj.then((movies) => {
    callback(movies);
  })
}

router.get('/', function (req, res, next) {
  getIndexData((mdatas) => {
    console.log(mdatas);
    let recArr = mdatas[0];
    let hotArr = mdatas[1];
    res.render('index.html', { recArr, hotArr });
  })

});
//读取点播片库
function getListData(callback) {
  let p1 = new Promise((resolved, rejected) => {
    dbObj.search("updmovie", {}, {}, { limit: 80 }, (err, data) => {
      resolved(data);
    });
  });
  let p2 = new Promise((resolved, rejected) => {
    dbObj.search("likemovie", {}, {}, { limit: 80 }, (err, data) => {
      resolved(data);
    })
  })
  let prmObj = Promise.all([p1, p2]);
  prmObj.then((movies) => {
    callback(movies);
  })

};



//点播片库
router.get("/list", (req, res) => {
  getListData((mydata) => {
    // console.log(mydata);
    let upArr = mydata[0];
    let likeArr = mydata[1];
    res.render("list.html", { upArr, likeArr });
  })

});

//读取猜你喜欢数据
function getGuessdata(callback) {
  let p1 = new Promise((resolved, rejected) => {
    dbObj.search("gussmovie", {}, {}, { limit: 9 }, (err, data) => {
      resolved(data);
    });
  })
  let p2 = new Promise((resolved, rejected) => {
    dbObj.search("hot", {}, {}, { limit: 9 }, (err, data) => {
      resolved(data);
    });
  });

  let prm = Promise.all([p1, p2]);
  prm.then((movies) => {
    callback(movies);
  })
};
router.get("/video", (req, res) => {
  getGuessdata((mydatas) => {
    console.log(mydatas);
    let gussArr = mydatas[0];//代表的是p1
    let hottArr = mydatas[1];//代表的是p2
    res.render("video.html", { gussArr, hottArr });
  })

});

//显示登录页面
router.get("/login", (req, res) => {
  res.render("login.html");
});
//处理登录页面
router.post("/login", (req, res) => {
  let { usr, pwd } = req.body;
  console.log(req.body);
  if (usr == "" || pwd == "") {
    res.send("<script>alert('输入内容不能为空');location.href='/login'</script>");
    return false;
  } 
  let reg = /^[a-zA-Z]\w{5,11}/;
  if (!reg.test(usr)) {
    res.send("<script>alert('帐号格式不正确！正确的格式为：必须以字母开头后面可以是字母、数字和下划线，总长度为：6至12');location.href='/login'</script>")
    return false;
  
  }
  if(usr =="sdfghj"&&pwd =="123456"){
     console.log(usr)
        res.send("<script>alert('输入正确';location.href='/'</script>");
        return false;
    }
  // dbObj.search("user", { "usr": usr }, {}, {}, (err, data) => {
  //   console.log(data);
  //   if (data.length == 1) {
  //     // res.send("<script>alert('该账号已经注册过';location.href='/regest'</script>");
   
  //     if (usr == data.usr) {
  //       if (pwd == data.pwd) {
  //         res.send("<script>alert('输入正确';location.href='/'</script>");

  //       }
  //     } else {
  //       res.send("<script>alert('账号输入错误';location.href='/login'</script>");

  //     }

  //   }
    // else {

    //   const secret = '123@#$asdf';  //密钥
    //   pwd = crypto.createHmac('sha256', secret)
    //     .update(pwd)      //要加密的字符串
    //     .digest('hex');

    //   dbObj.add("user", { "usr": usr, "pwd": pwd }, (err) => {
    //     if (err) {//注册失败
    //       res.send("<script>alert('注册失败');location.href='/regest';</script>");
    //     } else {//注册成功
    //       res.send("<script>alert('注册成功');location.href='/login';</script>");
    //     }
    //   })
    // }
  // });
})
//显示注册页面
router.get("/regest", (req, res) => {
  res.render("regest.html");
});
//处理注册页面
router.post("/regest", (req, res) => {
  let { usr, pwd, repwd } = req.body;
  if (usr == "" || pwd == "" || repwd == "") {
    res.send("<script>alert('输入内容不能为空');location.href='/regest'</script>");
    return false;
  }
  //判断两次输入密码是否一致
  if (pwd != repwd) {
    res.send("<script>alert('两次输入密码不一致');location.href='/regest'</script>");
    return false;
  }
  //验证用户
  let reg = /^[a-zA-Z]\w{5,11}$/;
  if (!reg.test(usr)) {
    res.send("<script>alert('帐号格式不正确！正确的格式为：必须以字母开头后面可以是字母、数字和下划线，总长度为：6至12');location.href='/regest'</script>");
    return false;
  }
  //判断当前账号是否注册过
  dbObj.search("user", { "usr": usr }, {}, {}, (err, data) => {
    if (data.length == 1) {
      res.send("<script>alert('该账号已经注册过';location.href='/regest'</script>");
      return false;
    } else {

      const secret = '123@#$asdf';  //密钥
      pwd = crypto.createHmac('sha256', secret)
        .update(pwd)      //要加密的字符串
        .digest('hex');

      dbObj.add("user", { "usr": usr, "pwd": pwd }, (err) => {
        if (err) {//注册失败
          res.send("<script>alert('注册失败');location.href='/regest';</script>");
        } else {//注册成功
          res.send("<script>alert('注册成功');location.href='/login';</script>");
        }
      })
    }
  });
})
module.exports = router;
