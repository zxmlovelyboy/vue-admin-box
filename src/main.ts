import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { baidu } from './utils/system/statistics'
import 'element-plus/theme-chalk/display.css' // 引入基于断点的隐藏类
import 'element-plus/dist/index.css'
import 'normalize.css' // css初始化
import './assets/style/common.scss' // 公共css
import './theme/modules/chinese/index.scss'
import App from './App.vue'

import axios from 'axios'
import qs from 'qs'

import store from './store'
import router from './router'
import { getAuthRoutes } from './router/permission'
import i18n from './locale'
import constantFunc from './common/func'
if (import.meta.env.MODE !== 'development') { // 非开发环境调用百度统计
  baidu()
}

/** 权限路由处理主方法 */
getAuthRoutes()


let URL = ''
if(process.env.NODE_ENV == 'development'){    //根据是否是开发环境。来判断是否引入mock             //mock数据生成工具
  URL = 'http://192.168.1.181:8008'
}
else{
  URL = 'http://192.168.1.181:8008'
}
//定时任务，每次定时刷新token，让token不过期，接口token是30秒过期
const getToken = function () {
  axios.post(URL + '/token', qs.stringify({
    grant_type: 'password',
    username: 'admin',
    password: '123'
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }).then(function (res) {
    //token获取成功，改版token
    localStorageUtil.set('ACCESSTOKEN', res.data.access_token, 20) //过期
    store.commit('tokenChange', res.data.access_token)
  })
}
//启动token定时任务,10min刷新一次。
setInterval(function () {
  getToken()
}, 10*60*1000)


 var localStorageUtil = {
  set(key: string, val: any, expire: number) {
      var exp = expire ? Date.now() + expire * 1000 * 60 : -1;
      localStorage.setItem(key, JSON.stringify({ value: val, expire: exp }));
      console.log('set ' + key + ':' + JSON.stringify({ value: val, expire: new Date(exp).toLocaleString() }));
  },
  get(key: string) {
      var data = localStorage.getItem(key);
      // console.log(data);
      if (!data) return null;
      var dataObj = JSON.parse(data);
      if (dataObj.expire == -1)
          return dataObj.value;
      if (Date.now() >= dataObj.expire) {
          localStorage.removeItem(key);
          return null;
      } else {
          return dataObj.value;
      }
  }
};

// 路由跳转前检查Token 是否过期
router.beforeEach((to, from, next) => { //路由跳转时，添加进度条 
  const token = localStorageUtil.get('ACCESSTOKEN')
  if (token) {//是否过期？再次请求：“跳转”
    next()
  }
  else {
    axios.post(URL + '/token', qs.stringify({
      grant_type: 'password',
      username: 'admin',
      password: '123'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }).then(function (res) {
      //token获取成功，改版token
      localStorageUtil.set('ACCESSTOKEN', res.data.access_token, 20)
      store.commit('tokenChange', res.data.access_token)
      next()
    }, function (err) {
      next()
    })
  }
});

// 定时任务，让token不过期
getToken()

const app = createApp(App)
app.config.globalProperties.formatData = constantFunc // 自定义全局方法
app.use(ElementPlus, { size: store.state.app.elementSize })
app.use(store)
app.use(router)
app.use(i18n)
// app.config.performance = true
app.mount('#app')
