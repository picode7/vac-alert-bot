import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as fetch from 'node-fetch'
require('dotenv').config()
import TelegramBot = require('node-telegram-bot-api')

const token = process.env.TELEGRAM_TOKEN
if (!token) throw 'TELEGRAM_TOKEN is undefined'

const CHECK_MINUTES = 15
const MOTIVE_VAC = 2529894 // first vac: 2529894, second vac: 2529895
const locations = [
  { agenda_ids: 406456, name: 'Centre Hospitalier Universitaire  Dupuytren 1' },
  { agenda_ids: 407243, name: 'Polyclinique de Limoges  - Site Chenieux' },
  { agenda_ids: 413512, name: 'Polyclinique de Limoges - Emailleurs' },
]

const logFileName = `data/logs/${new Date().toISOString().replace(/:/g, '-')} log.txt`
fs.mkdirSync(path.dirname(logFileName), { recursive: true })
const logFile = fs.createWriteStream(logFileName, { flags: 'w' })
function log(...values: any[]) {
  const text = new Date().toISOString() + ' ' + values.join(' ')
  console.log(text)
  logFile.write(util.format(text + '\n'))
}

const backupFile = path.join('data/data.json')
let data = null
try {
  data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))
} catch (e) {}

let activeChats: TelegramBot.Chat[] = []
if (data?.activeChats) activeChats = data.activeChats

let lastSuccesses: { locationName: string; time: number }[] = []
if (data?.lastSuccesses) lastSuccesses = data.lastSuccesses

function backup() {
  fs.mkdirSync(path.dirname(backupFile), { recursive: true })
  fs.writeFileSync(backupFile, JSON.stringify({ activeChats, lastSuccesses }))
}
backup()

const activateBot = (msg: TelegramBot.Message) => {
  if (activeChats.find((v) => v.id === msg.chat.id) === undefined) {
    activeChats.push(msg.chat)
    log('activated chat', JSON.stringify(msg.chat))
    backup()
    bot.sendMessage(msg.chat.id, '🟢 Vaccine Bot Activated 💉🤖🔥')
    bot.sendMessage(
      msg.chat.id,
      `I'm checking every ${CHECK_MINUTES} Minutes for available vaccine appointments in those locations:${locations
        .map((v) => `\n • ${v.name}`)
        .join('')}\nI will update you if it looks like one is available 💉\n\nYou can also check my /status`
    )
  } else {
    bot.sendMessage(msg.chat.id, 'Bot already activated')
  }
}

const deactivateBot = (msg: TelegramBot.Message) => {
  const index = activeChats.findIndex((v) => v.id === msg.chat.id)
  if (index != -1) {
    activeChats.splice(index, 1)
    log('deactivated chat', JSON.stringify(msg.chat))
    backup()
    bot.sendMessage(msg.chat.id, '🔴 Vaccine Bot Deactivated')
  }
}

const status = (msg: TelegramBot.Message) => {
  log('status check', JSON.stringify(msg.chat))
  const index = activeChats.findIndex((v) => v.id === msg.chat.id)
  if (index != -1) {
    bot.sendMessage(
      msg.chat.id,
      `🟢 Vaccine Bot is activated and checking every ${CHECK_MINUTES} Minutes.\nUse /stop to deactivate`
    )
  } else {
    bot.sendMessage(msg.chat.id, '🔴 Vaccine Bot is deactivated.\nUse /start to activate')
  }
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true })
bot.onText(/\/start */, activateBot)
bot.onText(/\/activate */, activateBot)
bot.onText(/\/stop */, deactivateBot)
bot.onText(/\/deactivate */, deactivateBot)
bot.onText(/\/status */, status)

function broadcast(markdown: string) {
  for (const chat of activeChats) {
    bot.sendMessage(chat.id, markdown, { parse_mode: 'Markdown' })
  }
}

function checkAll() {
  log('Checking all ...')
  for (const location of locations) {
    checkLocation(location)
  }
}

function init() {
  checkAll()
  setInterval(() => checkAll(), 1000 * 60 * CHECK_MINUTES)
}

init()

function checkLocation({ agenda_ids, name }: { agenda_ids: number; name: string }) {
  const url = new URL('https://partners.doctolib.fr/availabilities.json')
  url.searchParams.append('start_date', formatDate(new Date()))
  url.searchParams.append('visit_motive_ids', MOTIVE_VAC.toString())
  url.searchParams.append('agenda_ids', agenda_ids.toString())
  url.searchParams.append('insurance_sector', 'public')
  url.searchParams.append('practice_ids', '162612')
  url.searchParams.append('destroy_temporary', 'true')
  url.searchParams.append('limit', '7')
  url.searchParams.append('allowNewPatients', 'true')
  url.searchParams.append('telehealth', '240406')
  url.searchParams.append('isOrganization', 'true')
  url.searchParams.append('telehealthFeatureEnabled', 'false')
  url.searchParams.append('vaccinationMotive', 'true')
  url.searchParams.append('vaccinationDaysRange', '26')
  url.searchParams.append('vaccinationCenter', 'true')
  url.searchParams.append('nbConfirmedVaccinationAppointments', '11940')

  fetch(url.href).then((r: any) => {
    r.json().then((result: any) => {
      if (result.availabilities?.length > 0) {
        if (getPrevSuccess(name)) {
          log('new appointments for', name, ':', JSON.stringify(result))
          broadcast(
            `Looks like appointments for "${name}" are available!\n[Click here to get to the website](https://partners.doctolib.fr/centre-de-vaccinations-internationales/limousin/vaccination-covid-19-professionnels-de-sante?pid=practice-162612&enable_cookies_consent=1) - ⚠ you will have to pick the location and motive manually!`
          )
          setPrevSuccess(name)
        } else {
          log('old appointments for', name, ':', JSON.stringify(result))
        }
      } else {
        log('no appointments for', name, ':', JSON.stringify(result))
      }
    })
  })
}

function getPrevSuccess(locationName: string) {
  const lastSuccess = lastSuccesses.find((v) => v.locationName == locationName)
  return (lastSuccess?.time ?? 0) + 1000 * 60 * 60 * 24 < Date.now()
}
function setPrevSuccess(locationName: string) {
  const time = Date.now()
  const lastSuccess = lastSuccesses.find((v) => v.locationName == locationName)
  if (typeof lastSuccess == 'undefined') {
    lastSuccesses.push({ time, locationName })
  } else {
    lastSuccess.time = time
  }
  backup()
}

function formatDate(d: Date) {
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  let year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}
