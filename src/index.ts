import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import router from "./router";
import { ping } from "./utils/ping";

const application = express();
application.use(express.json());
application.use(router);

const token = "";

const telegramBot = new TelegramBot(token, { polling: true });

const start = async () => {
  telegramBot.on("message", (message) => {
    console.log(message);
  });

  application.listen(process.env.PORT || 5000, () => {
    console.log("app started", new Date());
  });

  setInterval(ping, 5 * 60 * 1000);
};

try {
  start();
} catch (error: any) {
  console.log(error?.message);
}
