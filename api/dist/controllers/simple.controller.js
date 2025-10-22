"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const express_1 = require("express");
class RestController {
    constructor(service) {
        this.service = service;
        this.router = (0, express_1.Router)();
        this.getUtamByFilter = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { es, ig, fn, sf, ic, ed, sd } = req.query;
            const result = yield this.service.getUtamByFilter(es, ig, fn, sf, ic, ed, sd);
            res.json(result);
        });
        this.getOdByFilter = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { utam, mv } = req.query;
            const result = yield this.service.getOdByFilter(utam, mv);
            res.json(result);
        });
    }
    getRouter() {
        // UTAM routes
        this.router.get('/info', this.getUtamByFilter);
        // OD routes
        this.router.get('/od', this.getOdByFilter);
        return this.router;
    }
}
const AppController = (context) => new RestController(context.service);
exports.AppController = AppController;
//# sourceMappingURL=simple.controller.js.map