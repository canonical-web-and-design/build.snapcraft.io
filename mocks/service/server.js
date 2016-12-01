import express from 'express';
import github from './github';
const app = express();

app.use('/github', github);

app.listen('4000', '127.0.0.1');
