import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import fs from "fs"
// import AWS from "aws-sdk"
import {
    S3Client,
    PutObjectCommand,
} from "@aws-sdk/client-s3";


dotenv.config();
const app = express();
const port = 5000;

express.json();

// configure aws
// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION
// })

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const upload = multer({
    dest: 'uploads/'
})

async function uploadFileToS3(file) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}_${file.originalname}`,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype
    }
    await s3Client.send(
        new PutObjectCommand(params),
      );

    return `https://s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${params.Key}`;
    
}

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: 'file not found' })
    }
    try {
        const data = await uploadFileToS3(file);
        
        fs.unlinkSync(file.path)
        res.json({ success: true, data })
    } catch (error) {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
        }
        res.json({ success: false, error })
    }
})

app.get('/', (req, res) => {
    res.send("welcome to s3 file upload project !!")
})

app.listen(port, () => {
    console.log(`s3-file-upload is running on ${port}`)
})