import { Router } from "express";
import { IService } from "../services/simple.service";

class RestController {
    constructor(private readonly service: IService) {
    }

    private router: Router = Router();

    getUtamByFilter = async (req: any, res: any) => {
        const { es, ig, fn, sf, ic, ed, sd } = req.query;
        const result = await this.service.getUtamByFilter(es, ig, fn, sf, ic, ed, sd);
        res.json(result);
    };
    getOdByFilter = async (req: any, res: any) => {
        const { utam, mv } = req.query;
        const result = await this.service.getOdByFilter(utam, mv);
        res.json(result);
     };

    public getRouter(): Router {

        // UTAM routes
        this.router.get('/info', this.getUtamByFilter);

        // OD routes
        this.router.get('/od', this.getOdByFilter);
        return this.router;
    }
}

export const AppController = (context: { service: IService }) => new RestController(context.service);
