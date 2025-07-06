/**
 * @fileoverview Main entry file for the Hydra Daemon (fără Docker). 
 * Acest fișier configurează un server Express și WebSocket pentru control și monitorizare.
 */

const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const CatLoggr = require('cat-loggr');
const WebSocket = require('ws');
const http = require('http');
const fs = require('node:fs');
const path = require('path');
const chalk = require('chalk');
const ascii = fs.readFileSync('./handlers/ascii.txt', 'utf8');
const { init, createVolumesFolder } = require('./handlers/init.js');
const { seed } = require('./handlers/seed.js');
const config = require('./config.json');

const app = express();
const server = http.createServer(app);

const log = new CatLoggr();

console.log(chalk.gray(ascii) + chalk.white(`version v${config.version}\n`));
init();
seed();

app.use(bodyParser.json());
app.use(basicAuth({
    users: { 'Skyport': config.key },
    challenge: true
}));

// Import route-urile tale (fără Docker)
const instanceRouter = require('./routes/Instance.js');
const deploymentRouter = require('./routes/Deploy.js');
const filesystemRouter = require('./routes/Volume.js');
const archiveRouter = require('./routes/ArchiveVolume.js');
const powerRouter = require('./routes/PowerActions.js');

// Folosește rutele
app.use('/instances', instanceRouter);
app.use('/instances', deploymentRouter);
app.use('/instances', powerRouter);
app.use('/archive', archiveRouter);
app.use('/fs', filesystemRouter);

// Route pentru info sistem
app.get('/', async (req, res) => {
    res.json({
        versionFamily: 1,
        versionRelease: 'draco ' + config.version,
        online: true,
        remote: config.remote,
        mysql: {
            host: config.mysql.host,
            user: config.mysql.user,
            password: config.mysql.password
        }
        // Fără Docker info
    });
});

// Middleware pentru erori
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something has... gone wrong!');
});

// Pornirea serverului
const port = config.port;
setTimeout(() => {
  server.listen(port, () => {
    log.info('Draco este listening pe portul ' + port);
  });
}, 2000);