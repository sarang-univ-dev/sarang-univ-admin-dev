import { createServer } from "https";
import { parse } from "url";
import next from "next";
import fs from "fs";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const httpsOptions = {
  key: fs.readFileSync("./ssl/local.sarang-admin.key"),
  cert: fs.readFileSync("./ssl/local.sarang-admin.crt"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(443, err => {
    if (err) throw err;
    // eslint-disable-next-line no-console
    console.log("> Server started on https://local.admin.sarang-univ.com ");
  });
});
