"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const queryGraphQl = __importStar(require("./controllers/queryGraphql"));
const path = require("path");
const os = require("os");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const HOST = os.hostname();
app.use((req, _, next) => {
    console.log('Time:', Date.now(), req.originalUrl);
    next();
});
app.use(express_1.default.static('build'));
app.get('/api/info', queryGraphQl.getUtamByFilter);
app.get('/api/od', queryGraphQl.getOdByFilter);
app.get('/*', (_, res) => res.sendFile(path.resolve('build/index.html')));
app.listen(PORT, () => console.log(`Server is running here https://${HOST}:${PORT}`));
//# sourceMappingURL=server.js.map