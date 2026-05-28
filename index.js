import express from 'express';
import bodyParser from 'body-parser';
import { auth, JWT } from 'google-auth-library';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Firestore } from '@google-cloud/firestore';

const app = express();
const PORT = 3000;

// Google service account
import serviceAccount from './service-account.json' with { type: 'json' };
const projectId = serviceAccount.project_id;

const db = new Firestore({
  keyFilename: 'service-account.json',
});

// import bank data from json file
const bankData = JSON.parse(fs.readFileSync('assets/data/bank_data.json', 'utf-8'));

app.use(express.json());
app.use(cors());

// MARK: Start server
app.listen(PORT, () => {
  console.log(`🚀 API server đang chạy tại http://localhost:${PORT}`);
});

// MARK: get status
app.get('/test', (req, res) => {
  res.send('🚀 API server đang chạy!');
});

// MARK: post data route
app.post('/api/sync', async (req, res) => {
    console.log('Bắt đầu chạy đồng bộ dữ liệu...');
    try {
        const bulkWriter = db.bulkWriter();
        
        for (var item in bankData) {
            var data = bankData[item];
            var id = data.id;
            delete data.id;
            const docRef = db.collection('banks').doc(id);
            bulkWriter.set(docRef, data);
        }

        await bulkWriter.close();
        res.status(200).json({message: 'Đồng bộ dữ liệu thành công!' });
    } catch (e) {
        console.error('Lỗi khi đồng bộ dữ liệu:', e);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi đồng bộ dữ liệu.' });
    }
    console.log('Kết thúc đồng bồ dự liệu.');
})

// MARK: Test firestore connection
app.post('/api/test-firestore', async (req, res) => {
    try {
        const docRef = db.collection('test').doc('testDoc');
        await docRef.set({ message: 'Hello Firestore!' });
        const doc = await docRef.get();
        if (doc.exists) {
            res.status(200).json({ message: 'Firestore connection successful!', data: doc.data() });
        } else {
            res.status(404).json({ message: 'Document not found.' });
        }
    } catch (e) {
        console.error('Error testing Firestore connection:', e);
        res.status(500).json({ error: 'Error testing Firestore connection.' });
    }
});