import { Router } from "express";
import { AppError } from "../errors/app-errors";
import { IService } from "../services/simple.service";

export interface IRestController {
    getRouter(): Router;
}

class RestController implements IRestController {
    private router: Router = Router();

    constructor(private readonly service: IService) {
    }

    getUtamByFilter = async (req: any, res: any) => {
        try {
            const { es, ig, fn, sf, ic, ed, sd } = req.query;
            const result = await this.service.getUtamByFilter(es, ig, fn, sf, ic, ed, sd);
            res.json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    getOdByFilter = async (req: any, res: any) => {
        try {

            const { utam, mv } = req.query;
            const result = await this.service.getOdByFilter(utam, mv);
            res.json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
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
