const App = require('./app/index');
// const cluster = require('cluster');
//
// if (cluster.isMaster) {
//     cluster.setupMaster({
//         execArgv: ['--inspect-brk']
//     });
// }


let app = new App();

app.run();


