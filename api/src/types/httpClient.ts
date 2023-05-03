import { AxiosRequestConfig, AxiosResponse } from "axios";

export type HttClient ={
    post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
}