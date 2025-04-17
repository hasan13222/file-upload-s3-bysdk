import express from "express"
import dotenv from "dotenv"
import multer from "multer"
import fs from "fs"
import AWS from "aws-sdk"

dotenv.config();
const app = express();
const port = 5000;

express.json();

// configure aws
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

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
    return await s3.upload(params).promise();
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
    res.send("welcome to s3 file upload project.")
})

app.listen(port, () => {
    console.log(`s3-file-upload is running on ${port}`)
})