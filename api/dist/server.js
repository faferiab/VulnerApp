"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = require("path");
const os = require("os");
const mongodb_1 = require("mongodb");
const simple_service_1 = require("./services/simple.service");
const simple_controller_1 = require("./controllers/simple.controller");
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_repository_1 = require("./repositories/mongodb.repository");
dotenv_1.default.config({ path: ".env" });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const HOST = os.hostname();
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_URL = process.env.MONGO_URL;
const URL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}/?retryWrites=true&w=majority&appName=vulnerapp`;
const client = new mongodb_1.MongoClient(URL, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    timeoutMS: 3000
});
client.connect();
const repository = (0, mongodb_repository_1.AppRepository)({ client });
const service = (0, simple_service_1.AppService)({ repository });
const controller = (0, simple_controller_1.AppController)({ service });
app.use((req, _, next) => {
    console.log('Time:', Date.now(), req.originalUrl);
    next();
});
app.use(express_1.default.static('build'));
app.use('/api', controller.getRouter());
//app.get('/api/info', queryGraphQl.getUtamByFilter);
//app.get('/api/od', queryGraphQl.getOdByFilter);
app.get('/*', (_, res) => res.sendFile(path.resolve('build/index.html')));
app.listen(PORT, () => console.log(`Server is running here https://${HOST}:${PORT}`));
//# sourceMappingURL=server.js.map