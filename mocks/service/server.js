import express from 'express';
import github from './github';
import launchpad from './launchpad';
const app = express();

app.use('/github', github);
app.use('/launchpad', launchpad);

app.listen('4000', '127.0.0.1');
