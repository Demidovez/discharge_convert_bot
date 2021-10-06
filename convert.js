const axios = require("axios");
var convert = require("xml-js");
const fs = require("fs");
const moment = require("moment");
var iconv = require("iconv-lite");
const { Markup } = require("telegraf");

async function convert_xml_txt(state, ctx) {
  const { file_id, user } = state;

  const fileUrl = await ctx.telegram.getFileLink(file_id);
  const response = await axios.get(fileUrl.href);

  try {
    const dataFromXml = convert.xml2js(response.data);

    let accountinfoArrays = dataFromXml.elements[0].elements.filter((info) => {
      const OPERINFO =
        info.elements.find((elem) => elem.name == "OPERINFO") || {};

      return OPERINFO.hasOwnProperty("elements");
    });

    const fileName = "Выписка_utf.txt";
    const fileConvertName = "Выписка.txt";
    var now = new Date();
    var period = moment(now).format("DD.MM.YYYY");
    var time = moment(now).format("HH:mm:ss");

    createFile(fileName, user, period, time);

    accountinfoArrays.map(({ elements }) => {
      const operInfo = elements.find((elem) => elem.name === "OPERINFO") || {};
      const PERIOD = elements.find((elem) => elem.name === "PERIOD") || {};

      operInfo.elements.map((oper) => {
        const SUMOPER =
          oper.elements.find((elem) => elem.name === "SUMOPER") || {};

        if (SUMOPER.attributes.nd !== "0") {
          operND_Day(
            fileName,
            user,
            PERIOD.elements[0].text,
            SUMOPER.attributes,
            oper
          );
        } else {
          operNK_Day(
            fileName,
            user,
            PERIOD.elements[0].text,
            SUMOPER.attributes,
            oper
          );
        }
      });
    });

    doneFile(fileName);
    sendFile(fileName, fileConvertName, ctx);
  } catch (err) {
    console.error(err);
    ctx.reply("Ошибка файла!", Markup.removeKeyboard());
    ctx.scene.leave();
  }
}

function operND_Day(fileName, user, period, attributes, oper) {
  //   console.log(oper);

  const DOCN = oper.elements.find((elem) => elem.name === "DOCN") || {};
  const ACCKORR = oper.elements.find((elem) => elem.name === "ACCKORR") || {};
  const UNPKORR = oper.elements.find((elem) => elem.name === "UNPKORR") || {};
  const NAMEKORR = oper.elements.find((elem) => elem.name === "NAMEKORR") || {};
  const DETPAY = oper.elements.find((elem) => elem.name === "DETPAY") || {};

  const content = `СекцияДокумент=Платежное поручение
Номер=${DOCN.elements[0].text}
Дата=${period.replace("за ", "")}
Сумма=${attributes.nd}
ПлательщикСчет=${user.schet.substring(0, user.schet.length - 5) + "*"}
ПлательщикИНН=${user.unp}
Плательщик=${user.ip}
ПолучательСчет=${
    ACCKORR.elements[0].text.substring(0, ACCKORR.elements[0].text.length - 5) +
    "*"
  }
ДатаСписано=${period.replace("за ", "")}
ПолучательИНН=${UNPKORR.elements[0].text}
Получатель=${NAMEKORR.elements[0].text}
НазначениеПлатежа=${DETPAY.elements[0].text}
КонецДокумента
`;

  fs.appendFileSync(fileName, content, function (err) {
    if (err) console.log(err);
  });
}

function operNK_Day(fileName, user, period, attributes, oper) {
  //   console.log(oper);

  const DOCN = oper.elements.find((elem) => elem.name === "DOCN") || {};
  const ACCKORR = oper.elements.find((elem) => elem.name === "ACCKORR") || {};
  const UNPKORR = oper.elements.find((elem) => elem.name === "UNPKORR") || {};
  const NAMEKORR = oper.elements.find((elem) => elem.name === "NAMEKORR") || {};
  const DETPAY = oper.elements.find((elem) => elem.name === "DETPAY") || {};

  const content = `СекцияДокумент=Платежное поручение
Номер=${DOCN.elements[0].text}
Дата=${period.replace("за ", "")}
Сумма=${attributes.nk}
ПлательщикСчет=${
    ACCKORR.elements[0].text.substring(0, ACCKORR.elements[0].text.length - 5) +
    "*"
  }
ПлательщикИНН=${UNPKORR.elements[0].text}
Плательщик=${NAMEKORR.elements[0].text}
ПолучательСчет=${user.schet.substring(0, user.schet.length - 5) + "*"}
ДатаПоступило=${period.replace("за ", "")}
ПолучательИНН=${user.unp}
Получатель=${user.ip}
НазначениеПлатежа=${DETPAY.elements[0].text}
КонецДокумента
`;

  fs.appendFileSync(fileName, content, function (err) {
    if (err) console.log(err);
  });
}

function createFile(fileName, user, period, time) {
  const content = `1CClientBankExchange
ВерсияФормата=1.02
Кодировка=Windows
Отправитель=АСБ Беларусбанк ОАО ЦБУ №322 филиала №312
Получатель=${user.ip}
ДатаСоздания=${period.replace("за ", "")}
ВремяСоздания=${time}
ДатаНачала=${period.replace("за ", "")}
ДатаКонца=${period.replace("за ", "")}
РасчСчет=${user.schet.substring(0, user.schet.length - 5) + "*"}
Документ=Платежное поручение
`;

  // const buffer = Buffer.from(txtContent, 'latin1')

  fs.appendFileSync(fileName, content, function (err) {
    if (err) console.log(err);
  });
}

function doneFile(fileName) {
  const content = `КонецФайла`;

  fs.appendFileSync(fileName, content, function (err) {
    if (err) console.log(err);
  });
}

async function sendFile(fileName, fileConvertName, ctx) {
  const data = fs.readFileSync(fileName);
  let buff = new Buffer.from(data);
  let str = iconv.decode(buff, "utf8");
  let utf8 = iconv.encode(str, "win1251");
  fs.writeFileSync(fileConvertName, utf8);

  await ctx.reply("Файл готов!", Markup.removeKeyboard());
  ctx.telegram
    .sendDocument(ctx.from.id, {
      source: fileConvertName,
      filename: fileConvertName,
    })
    .catch(function (error) {
      console.log(error);
    })
    .then(() => {
      try {
        fs.unlinkSync(fileName);
        fs.unlinkSync(fileConvertName);
      } catch (err) {
        console.error(err);
      }
    });
}

module.exports = convert_xml_txt;
