const axios = require('axios')
const random = require('random')
const { authenticator  } = require('otplib')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const Hex = require('crypto-js/enc-hex')
const HttpsProxyAgent = require("https-proxy-agent")
const httpsAgent = new HttpsProxyAgent(`http://127.0.0.1:7890`)

const { apiKey, apiSecretKey, totpSecret, password }  = require('./config.json')
const address = require('./address.json')

const sleep = (time) => {
  let startTime = new Date().getTime() + parseInt(time, 10)
  while(new Date().getTime() < startTime) {}
}
class FtxClient {
  constructor(key, secretKey) {
    this.instance = axios.create({
      proxy: false,
      httpsAgent,
      baseURL: 'https://ftx.com/api/',
      timeout: 50000,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json; utf-8',
        'FTX-KEY': key,
        // 'FTX-SUBACCOUNT': subaccount,
      }
    })

    // make signature
    this.instance.interceptors.request.use(
      config => {
        const now = Date.now()
        const method = config.method.toUpperCase()
        const { data, params } = config
        let sign = now + method

        config.headers['FTX-TS'] = now

        switch (method) {
          case 'GET':
          case 'DELETE':
            // sign += `/api/${config.url}?${new URLSearchParams(params).toString()}`
            sign += `/api/${config.url}`
            break
          case 'POST':
          case 'PUT':
          case 'PATCH':
            sign += `/api/${config.url}${JSON.stringify(data)}`
          }
        const signature = hmacSHA256(sign, secretKey).toString(Hex)
        config.headers['FTX-SIGN'] = signature
        return config
      },
      err => Promise.reject(err)
    )
  }

  _get(endpoint, params = {}) {
    return this.instance
      .get(endpoint, { params })
      .then(res => console.log(res.data))
      .catch(e => console.log(e.toJSON()))
  }

  _delete(endpoint, params = {}) {
    return this.instance
      .delete(endpoint, { params })
      .then(res => console.log(res.data))
      .catch(e => console.log(e.toJSON()))
  }

  _post(endpoint, data = {}) {
    return this.instance.post(endpoint, data)
  }
  // https://docs.ftx.com/zh/#aa14f75ed6
  withdraw(data) {
    return this._post('wallet/withdrawals', data)
  }

  getBalances() {
    return this._get('wallet/balances')
  }

}

const ftxClient = new FtxClient(apiKey, apiSecretKey)

// ;(async() => {
//   for(let i = 0; i < address.length; i++) {
//     const totpCode = authenticator.generate(totpSecret);
//     try {
//       const res = await ftxClient.withdraw({
//         coin: 'ETH',
//         size: random.float(0.025, 0.03).toFixed(random.int(3, 5)),
//         address: address[i],
//         // tag: null,
//         method: 'eth',
//         password: password,
//         code: totpCode
//       })
//       console.log('🚀 ~ file: index.js ~ line 99 ~ res', res.data)
//       const timeInterval = random.int(8 * 60, 20 * 60)
//       console.log('Now time:', new Date(), 'TimeInterval:', (timeInterval / 60).toFixed(2), 'Index:', i+1)
//       sleep(timeInterval * 1000)
//     } catch (error) {
//       console.log('🚀 ~ file: index.js ~ line 101 ~ error', error)
//     }
//   }
// })()


// ftxClient.getBalances()

