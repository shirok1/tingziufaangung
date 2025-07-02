/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getDayDetail, findWorkday } from 'chinese-days';
import { Bot, Context, webhookCallback } from "grammy";

export interface Env {
	BOT_INFO: string;
	BOT_TOKEN: string;
	CHAT_IDS: string;
	STICKER_ID: string;
	KV: KVNamespace;
}

async function workNotify(env: Env) {
	const bot = new Bot(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO) });
	const chatIds = env.CHAT_IDS.split(',');
	console.log(["chatIds", chatIds]);
	const today = new Date();
	const { work, name } = getDayDetail(today);
	if (work) {
		console.log('work');
		for (const chatId of chatIds) {
			console.log("sending work message to chatId", chatId);
			await bot.api.sendSticker(chatId, env.STICKER_ID);
			await bot.api.sendMessage(chatId, `聽朝要返工，早啲瞓啦……`);
		}
	} else {
		const [_, holiday] = name.split(',');
		console.log(holiday);
		const workday = findWorkday(0, today);
		console.log(workday);
		for (const chatId of chatIds) {
			console.log("sending holiday message to chatId", chatId);
			await bot.api.sendMessage(chatId, `聽日唔使返工，${holiday}`);
		}
	}
}

export default {
	async fetch(req) {
		const url = new URL(req.url);
		url.pathname = '/__scheduled';
		url.searchParams.append('cron', '0 0 * * *');
		return new Response(`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`);
	},

	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
	// [[triggers]] configuration.
	async scheduled(event, env: Env, ctx): Promise<void> {
		await workNotify(env);
	},
} satisfies ExportedHandler<Env>;
