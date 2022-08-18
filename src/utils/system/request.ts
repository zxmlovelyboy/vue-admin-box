import axios , { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import store from '@/store'
import { ElMessage } from 'element-plus'
const baseURL: any = import.meta.env.VITE_BASE_URL

const service: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 5000
})

// 请求前的统一处理
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // JWT鉴权处理
    if (store.getters['user/token']) {
      config.headers['token'] = store.state.user.token
    }
    return config
  },
  (error: AxiosError) => {
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res.code === 200) {
      return res
    } else {
      showError(res)
      return Promise.reject(res)
    }
  },
  (error: AxiosError)=> {
    console.log(error) // for debug
    const badMessage: any = error.message || error
    const code = parseInt(badMessage.toString().replace('Error: Request failed with status code ', ''))
    showError({ code, message: badMessage })
    return Promise.reject(error)
  }
)

// 错误处理
function showError(error: any) {
  // token过期，清除本地数据，并跳转至登录页面
  if (error.code === 403) {
    // to re-login
    store.dispatch('user/loginOut')
  } else {
    ElMessage({
      message: error.msg || error.message || '服务异常',
      type: 'error',
      duration: 3 * 1000
    })
  }
  
}


var localStorageUtil = {
  set(key:any, val:any, expire:any,) {
      var exp = expire ? Date.now() + expire * 1000 * 60 : -1;
      localStorage.setItem(key, JSON.stringify({ value: val, expire: exp }));
      console.log('set ' + key + ':' + JSON.stringify({ value: val, expire: new Date(exp).toLocaleString() }));
  },
  get(key:any) {
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

export default service
