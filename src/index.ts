import * as express from 'express';
import * as bodyParser from 'body-parser';
import { capture }  from './capture';

const app = express();
const port = 3000; // TODO: Make this configurable

app.use(bodyParser.json());
app.all('/', capture);
app.listen(port, () => console.log(`Screen.rip is listening on port ${port}!`))
