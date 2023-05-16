import express from 'express';
import cors from 'cors';
import {randomBytes} from 'crypto';
const app = express();
app.use(cors());

const data = [{
  id: "d58e3582afa99040e27b92b13c8f2283",
  pgive: 14000 
},
{
  id: "5e1d1708ae935f26cca3877adb441c3c",
  pgive: 4800
},
{
  id: "9e58f9a28f8700c2e76a67620abf7a3d",
  pgive: 12200 
},
{
  id: "222cc3736ce7ef0855a4d00584a5f93f",
  pgive: 8200
},
{
  id: "951d3af3f2376d7dd4201347ad8fa74d",
  pgive: 14600
},
{
  id: "073bd25b5e5496594c3cceb741eddf74",
  pgive: 16000 
},
{
  id: "c8432ead97ceea6ffd5c5591906c0959",
  pgive: 16200 
}];


app.get('/', (req, res) => {
    let i = Math.round(Math.random()*(data.length-1));
    // let i = 0;
    res.json(data[i]);
});

app.get('/random', (req, res) => {
    let _data = {
        id : randomBytes(8).toString('hex'),
        pgive: Math.round(Math.random()*200)*100
    };
    res.json(_data);
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});