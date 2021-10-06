const fs = require("fs");
const {
  Telegraf,
  session,
  Markup,
  Scenes: { WizardScene, Stage },
} = require("telegraf");
const convert_xml_txt = require("./convert");
const bot = new Telegraf("2034852361:AAGD2mHjXGT6jDbORPTDOlRUsFV6Rp0O9CE");
//2034852361:AAGD2mHjXGT6jDbORPTDOlRUsFV6Rp0O9CE
//813448297:AAH5SnoeF17D8a_9R7845dlq4bkBDEOnnMs

const users = [321438949, 310597397];

// При каждом нажатии на кнопку происходит проверка на доступ
bot.use((ctx, next) => {
  if (users.includes(ctx.message.from.id)) {
    next();
  } else {
    ctx.telegram.sendMessage(
      321438949,
      `Not have accesses ${ctx.message.from.id}!`
    );
    console.log(`Not have accesses ${ctx.message.from.id}!`);
  }
});

bot.start((ctx) => {
  ctx.reply("Добрый день! Жду XML файл...");
});

try {
  const convertWizard = new WizardScene(
    "convert-wizard",
    // ШАГ 1. Выбор ИП
    (ctx) => {
      ctx.reply(
        "Выберите ИП",
        Markup.keyboard([["Александр", "Екатерина"]])
          .oneTime()
          .resize()
      );

      return ctx.wizard.next();
    },
    // ШАГ 2. Определение текущего ИП
    async (ctx) => {
      switch (ctx.message.text) {
        case "Александр":
          const user1 = fs.readFileSync("user1.txt", "utf-8").split(/\r?\n/);

          ctx.wizard.state.user = {
            ip: user1[0],
            schet: user1[1],
            unp: user1[2],
          };
          break;
        case "Екатерина":
          const user2 = fs.readFileSync("user2.txt", "utf-8").split(/\r?\n/);

          ctx.wizard.state.user = {
            ip: user2[0],
            schet: user2[1],
            unp: user2[2],
          };
          break;
        default:
          ctx.reply("Ошибка N88968", Markup.removeKeyboard());
          ctx.scene.leave();
      }

      await convert_xml_txt(ctx.wizard.state, ctx);

      return ctx.scene.leave();
    }
  );

  const schetWizard = new WizardScene(
    "schet-wizard",
    // ШАГ 1. Выбор ИП
    (ctx) => {
      ctx.reply(
        "Выберите ИП",
        Markup.keyboard([["Александр", "Екатерина"]])
          .oneTime()
          .resize()
      );

      return ctx.wizard.next();
    },
    // ШАГ 2. Изменение счета
    async (ctx) => {
      switch (ctx.message.text) {
        case "Александр":
          const user1 = fs.readFileSync("user1.txt", "utf-8").split(/\r?\n/);

          ctx.wizard.state.user = {
            file: "user1.txt",
            ip: user1[0],
            schet: user1[1],
            unp: user1[2],
          };
          break;
        case "Екатерина":
          const user2 = fs.readFileSync("user2.txt", "utf-8").split(/\r?\n/);

          ctx.wizard.state.user = {
            file: "user2.txt",
            ip: user2[0],
            schet: user2[1],
            unp: user2[2],
          };
          break;
        default:
          ctx.reply("Ошибка N88968", Markup.removeKeyboard());
          ctx.scene.leave();
      }

      await ctx.reply(ctx.wizard.state.user.schet);
      ctx.reply(
        "Введите новый счет:",
        Markup.keyboard([["Отмена"]])
          .oneTime()
          .resize()
      );

      return ctx.wizard.next();
    },
    // ШАГ 3. Ввод нового счета
    async (ctx) => {
      if (ctx.message.text === "Отмена") {
        ctx.reply("Изменение счета отменено!", Markup.removeKeyboard());
        return ctx.scene.leave();
      }

      ctx.wizard.state.user.schet = ctx.message.text;
      await ctx.reply(`
${ctx.wizard.state.user.ip}
Счет: ${ctx.wizard.state.user.schet}
УНП: ${ctx.wizard.state.user.unp}
      `);

      const content = `${ctx.wizard.state.user.ip}
${ctx.wizard.state.user.schet}
${ctx.wizard.state.user.unp}
`;

      fs.writeFile(ctx.wizard.state.user.file, content, function () {
        ctx.reply("Счет изменен! Спасибо!", Markup.removeKeyboard());
      });

      return ctx.scene.leave();
    }
  );

  const stage = new Stage([convertWizard, schetWizard]);

  bot.use(session());
  bot.use(stage.middleware());
} catch (err) {
  console.error(err);
}

bot.on("document", (ctx) => {
  ctx.scene.enter("convert-wizard", { file_id: ctx.message.document.file_id });
});

bot.command("invoice", (ctx) => {
  ctx.scene.enter("schet-wizard");
});

bot.launch();
