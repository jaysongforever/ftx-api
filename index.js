const _axios = require('axios')
const hmacSHA256 = require('crypto-js/hmac-sha256')
const Hex = require('crypto-js/enc-hex')
const HttpsProxyAgent = require("https-proxy-agent")
const httpsAgent = new HttpsProxyAgent(`http://127.0.0.1:7890`)

const apiKey = ''
const apiSecretKey = ''

class FtxClient {
  constructor(apiKey, apiSecretKey) {
    this.instance = _axios.create({
      proxy: false,
      httpsAgent,
      baseURL: 'https://ftx.com/api/',
      timeout: 5000,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json; utf-8',
        'FTX-KEY': apiKey,
        // 'FTX-SUBACCOUNT': subaccount,
      },
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
        const signature = hmacSHA256(sign, apiSecretKey).toString(Hex)
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
    return this.instance
      .post(endpoint, data)
      .then(res => console.log(res.data))
      .catch(e => console.log(e.toJSON()))
  }

  withdraw(coin, size, address, tag = null, password, code) {
    return this._post('wallet/withdrawals', { coin, size, address, tag, password, code })
  }

  getBalances() {
    return this._get('wallet/balances')
  }

  getAllBalances() {
    return this._get('wallet/all_balances')
  }
}

const ftxClient = new FtxClient(apiKey, apiSecretKey)

ftxClient.getBalances()

