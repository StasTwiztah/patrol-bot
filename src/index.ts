import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import router from "./router";
import { ping } from "./utils/ping";
import { Pulpulaks } from "./Layers/Pulpulaks";
import { getDistance } from "./utils/getDistance";
import { Coffee } from "./Layers/Coffee";

const application = express();
application.use(express.json());
application.use(router);

const TOKEN = "5433793251:AAETHL0Hd1bke-Hyem65RD6oKvyBlo1zhCY";
const DEFAULT_RADIUS = 10000000;

const telegramBot = new TelegramBot(TOKEN, { polling: true });
telegramBot.setMyCommands([
  {
    command: "/pulpulaks",
    description: "Пулпулаки",
  },
  {
    command: "/coffee",
    description: "Кофейни",
  },
  {
    command: "/about",
    description: "Информация о боте",
  },
]);

const start = async () => {
  const userSettings: Record<
    string,
    {
      layer?: string;
      radius?: number;
    }
  > = {};

  telegramBot.on("location", (message) => {
    const { location, chat } = message;

    if (location) {
      const results = (
        userSettings?.[chat.id]?.layer === "pulpulaks" ? Pulpulaks : Coffee
      )
        .map((x) => ({
          ...x,
          distance: getDistance(
            x.latitude,
            x.longitude,
            location.latitude,
            location.longitude
          ),
        }))
        .filter(
          (x) =>
            x.distance < (userSettings?.[chat.id]?.radius || DEFAULT_RADIUS)
        )
        .sort((a, b) => {
          if (a.distance < b.distance) {
            return -1;
          }
          if (a.distance > b.distance) {
            return 1;
          }
          return 0;
        })
        .slice(0, 3);

      if (results.length === 0) {
        return telegramBot.sendMessage(chat.id, "Ничего не найдено");
      }

      for (const result of results) {
        telegramBot.sendMessage(
          chat.id,
          `
${result.name}\n${result.description || ""}
в ${getDistance(
            result.latitude,
            result.longitude,
            location.latitude,
            location.longitude
          )} м от вас`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Идем сюда",
                    callback_data: `location:${result.latitude};${result.longitude}`,
                  },
                ],
              ],
            },
          }
        );
      }
    }
  });

  telegramBot.on("message", (message) => {
    const { text, chat } = message;

    if (!text) return;

    if (text === "/start") {
      return telegramBot.sendMessage(
        chat.id,
        "Привет, нажми на меню и выбери действие"
      );
    }

    if (text === "/pulpulaks") {
      userSettings[chat.id] = { layer: "pulpulaks" };

      return telegramBot.sendMessage(chat.id, "Отправьте мне координаты", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Отправить координаты", request_location: true }],
          ],
          resize_keyboard: true,
        },
      });
    }

    if (text === "/coffee") {
      userSettings[chat.id] = { layer: "coffee" };

      return telegramBot.sendMessage(chat.id, "Отправьте мне координаты", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Отправить координаты", request_location: true }],
          ],
          resize_keyboard: true,
        },
      });
    }

    return telegramBot.sendMessage(chat.id, "Неизвестная команда");
  });

  telegramBot.on("callback_query", (query) => {
    const { data, message } = query;

    const res = data?.match(/^(\w*):(-?\d*.?\d*);(-?\d*.?\d*)$/);
    const command = res?.[1];
    const latitude = parseFloat(res?.[2] || "");
    const longitude = parseFloat(res?.[3] || "");

    if (command === "location" && message && latitude && longitude) {
      telegramBot.sendLocation(message.chat.id, latitude, longitude);
    }
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
