const Koa = require('koa');
const app = new Koa();
const router = require('./routes/index');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
const tokenUtils = require('./utils/tokenUtils');
const mysql = require('./utils/mysql');

app.use(cors());
app.use(async (ctx, next) => {
  console.log(`请求URL: ${ctx.url}`);
  const { url = '' } = ctx;
  if (!url.includes('registerCode') && !url.includes('register') && !url.includes('login') && !url.includes('logout')) {
    let token = '';
    let res = {
      code: 0,
      message: 'success'
    }
    if (ctx.query && ctx.query.token) {
      token = ctx.query.token;
    } else if (ctx.request.body && ctx.request.body.token) {
      token = ctx.request.body.token;
    } else {
      res.message = '请先登录';
      res.code = -1;
      return ctx.body = JSON.parse(JSON.stringify(res));
    }
    let result = tokenUtils.verifyToken(token);
    let { id } = result;
    const queryToken = `
      select * from token
      where
      value = '${token}';
    `;
    let response = await mysql.query(queryToken);
    if (response.length && id && response[0].userId===id) {
      ctx.state = id;
      await next();
    } else {
      res.message = '登陆超时';
      res.code = -1;
      return ctx.body = JSON.parse(JSON.stringify(res));
    }
  } else {
    await next();
  }
})
app.use(bodyParser());
app.use(router.routes(), router.allowedMethods());
app.listen(3001);