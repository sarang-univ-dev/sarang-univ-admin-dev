import Axios from "axios";
import config from "../constant/config";

export const webAxios = Axios.create({
  baseURL: config.API_HOST,
  withCredentials: true,
  timeout: 1000 * 10,
});
