import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const signedUrlExpiry = process.env.SIGNED_URL_EXPIRATION
const s3Bucket = process.env.ATTACHMENT_S3_BUCKET

export class AttachmentUtils {
 
    constructor(
         private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })
    ) {
    }

    getSignedURL(todoId: string): string {
        return this.s3.getSignedUrl('putObject', {
            Bucket: s3Bucket,
            Key: todoId,
            Expires: parseInt(signedUrlExpiry)
        })
    }
}
