import axios from 'axios';
import * as https from 'https';

class JwksClient {
  private options: {
    strictSsl: boolean;
    jwksUri: string;
  };

  constructor(options) {
    this.options = {
      strictSsl: true,
      ...options
    };
  }

  async getJwks() {
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: this.options.strictSsl,
      })
    });

    try {
      const response = await instance.get(this.options.jwksUri, {
        headers: {
          'Content-Type': 'application/json'
        },
      });

      console.log(response.data);
    }
    catch (e) {
      console.log(e);
    }
  }
}

export default JwksClient;