import { decode } from 'jsonwebtoken'

import { JwtPayload } from './JwtPayload'
import * as https from "https";
import JwkKey from "./JwkKey";
import axios from "axios";

type SigningKey = {
  kid: string;
  publicKey: string;
};

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload
  return decodedJwt.sub
}

/**
 * Get JSON Web Key Set from url
 * @returns if found, returns list of keys set; else, returns null
 * @param options
 */
export async function getJwks(options: { jwksUri: string; strictSsl: boolean;}): Promise<JwkKey[] | null> {
  const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: options.strictSsl,
    })
  });

  try {
    const response = await instance.get(options.jwksUri, {
      headers: {
        'Content-Type': 'application/json'
      },
    });

    return response.data.keys;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function certToPEM(cert: string) {
  // @ts-ignore
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}

/**
 * Get matched signing key from list of signing keys in downloaded Jwks
 * @param jwksUri URL to download Jwks
 * @param kid unique identifier for the key
 * @returns matched key
 */
export async function getSigningKey(jwksUri: string, kid: string): Promise<SigningKey> {
  const keys = await getJwks({
    jwksUri,
    strictSsl: false,
  });
  if (!keys || !keys.length) {
    return null;
  }

  const signingKeys = keys.filter(key => key.use === 'sig'
    && key.kty === 'RSA'
    && key.kid
    && (key.x5c && key.x5c.length) || (key.n && key.e)).map(key => ({
    kid: key.kid,
    publicKey: certToPEM(key.x5c[0])
  }));

  const signingKey = signingKeys.find(key => key.kid === kid);
  if (!signingKey) {
    return null;
  }

  return signingKey;
}