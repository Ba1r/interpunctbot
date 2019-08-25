import bot from "./bot";
import config from "./config";
import * as path from "path";
import o from "./src/options";
import knex from "./src/db"; // TODO add something so if you delete a message with a command it deletes the result messages or a reaction on the result msg or idk
import { Attachment, RichEmbed, DiscordAPIError } from "discord.js";
import * as moment from "moment";
import handleQuote from "./src/commands/quote";
import MB from "./src/MessageBuilder";
import * as request from "request";
import * as Router from "commandrouter";
import Info from "./src/Info";

//@ts-ignore
global.__basedir = __dirname;

import { EventEmitter } from "events"; // TODO add a thing for warning people like $warn [person] and have it be like 1 warning fine 2 warnings tempmute 3 warnings...and customizeable

import * as fs from "mz/fs";

const usage = new Usage({
	description: "All Commands",
	usage: ["command..."]
});

const router = new Router();

const production = process.env.NODE_ENV === "production";

const mostRecentCommands: string[] = [];

function devlog(...msg) {
	if (!production) {
		global.console.log(...msg);
	}
}

usage.add(
	"help",
	new Usage({
		description: "List help for all commands",
		usage: ["all", "command..."],
		callback: async (data, ...command) => {
			const all = command[0] === "all" ? command.shift() : false;
			const cmdToGetHelp = data.commands;
			if (command.join` `) {
				return await data.msg.reply(
					`Getting help on individual commands is disabled. See ${data.prefix}about for documentation`
				);
			}

			let commands = cmdToGetHelp.description; // Object.keys(data.allPastebin)
			let result = cmdToGetHelp.getUsage({
				data: all ? undefined : data
			}); // we need to // brb walk away from what I was typing hope it wasn't important
			result = result.map(line => `${data.prefix}${line}`).join`\n`;
			commands += `\`\`\`\n${result}\n\`\`\``;
			if (!all) {
				commands +=
					"and more that you or your server cannot use. `help all` for a full list";
			}
			return data.msg.reply(commands);
		}
	})
);
usage.add("settings", require("./src/commands/settings"));
router.add("ping", [], require("./src/commands/ping"));
router.add([], require("./src/commands/speedrun"));
router.add("log", [Info.r.manageBot], require("./src/commands/logging"));
// usage.add("quote", require("./src/commands/quote"));

usage.add(
	"purge",
	new Usage({
		description: "Deletes the last n messages from a channel",
		usage: ["msgs to delete"],
		requirements: [o.perm("MANAGE_MESSAGES"), o.myPerm("MANAGE_MESSAGES")],
		callback: async (data, n) => {
			await data.msg.reply("This command is not recommened for use.");
			const number = +n;
			if (isNaN(number)) {
				return await data.msg.reply("Invalid numbers");
			}
			const msgs = await data.msg.channel.fetchMessages({
				limit: number
			});
			msgs.array().forEach(msg => msg.delete());
		}
	})
);
remove(
	"spoiler",
	"please use the discord spoiler syntax instead, `||like this||`"
);

usage.rename("spaceChannels", "channels spacing");

usage.add("channels", require("./src/commands/channelmanagement"));

usage.rename("invite", "about");
//usage.add("about", require("./src/commands/about"));
router.add("about", [], require("./src/commands/about"));

usage.rename("downloadLog", "log download");
usage.rename("resetLog", "log reset");
usage.rename("listRoles", "settings listRoles");

usage.add(
	"crash",
	new Usage({
		description: "Throw an unhandled promise rejection",
		requirements: [o.owner()],
		callback: async data => {
			throw new Error("Crash Command Used");
		}
	})
);

router.add([], require("./src/commands/quote"));

function depricate(oldcmd, newcmd) {
	router.add(oldcmd, [], async (cmd, info) => {
		return await info.error(
			`\`${oldcmd}\` has been renamed to \`${newcmd}\` in ipv2. See \`help\` for more information. Join the support server in \`about\` if you have any issues.`
		);
	});
}

function remove(oldcmd, reason) {
	router.add(oldcmd, [], async (cmd, info) => {
		return await info.error(
			`\`${oldcmd}\` has been removed in ipv2. ${
				reason ? `${reason} ` : ""
			}Join the support server in \`about\` if you have any issues.`
		);
	});
}

depricate("settings prefix", "prefix");
depricate("settings lists", "lists <add/remove>");
depricate(
	"settings discmoji",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate(
	"settings rankmoji",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
remove(
	"settings permreplacements",
	"Permreplacements were never tested and probably didn't work."
);
depricate("settings speedrun", "speedrun <add/remove/default>");
depricate(
	"settings nameScreening",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate("settings logging", "log <enable/disable>");
depricate(
	"settings events",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate(
	"settings unknownCommandMessages",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate(
	"settings commandFailureMessages",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate(
	"settings autospaceChannels",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate(
	"settings listRoles",
	"IMPLEMENT BEFORE RELEASE;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;"
);
depricate("settings", "help");

/*

# ip!settings prefix [new prefix...]
# ip!settings lists [list] [pastebin id of list|remove]
# ip!settings discmoji restrict [role id] [emoji|emoji id]
# ip!settings discmoji unrestrict [role id] [emoji|emoji id]
# ip!settings discmoji list [emoji|emoji id]
 @ ip!settings rankmoji
 @ ip!settings rankmoji add [role id] [emoji]
 @ ip!settings rankmoji remove [role id|emoji]
 @ ip!settings rankmoji channel [channel]
# ip!settings permreplacements
# ip!settings permreplacements set [perm] [replacementID]
# ip!settings permreplacements remove [perm]
# ip!settings speedrun [abbreviation] [category]
# ip!settings nameScreening
# ip!settings nameScreening add [name parts...]
# ip!settings nameScreening remove [name parts...]
# ip!settings logging [true|false]
# ip!settings events welcome [none|welcome @s/%s message...]
# ip!settings events goodbye [none|goodbye @s/%s message...]
# ip!settings unknownCommandMessages [true|false]
# ip!settings commandFailureMessages [true|false]
# ip!settings autospaceChannels [true|false]
# ip!settings listRoles [true|false]
# ip!ping
# ip!speedrun rules [category...]
# ip!speedrun leaderboard [top how many?] [category...]
# ip!log download
# ip!log reset
 @ ip!purge [msgs to delete]
# ip!spoiler [message...]
# ip!channels spacing [space|dash]
# ip!channels sendMany [...message] [#channels #to #send #to]
# ip!about
# ip!crash
*/

router.add([], async (cmd, info) => {
	if (await info.db.getUnknownCommandMessages()) {
		return await info.error(
			"Command not found, use help for a list of commands"
		);
	} // else do nothing
});

fs.readdirSync(path.join(__dirname, "src/commands"));

const serverInfo = {};

function tryParse(json) {
	try {
		return typeof json === "string" ? JSON.parse(json) : json;
	} catch (e) {
		//console.log(`Could not parse  ^^${JSON.stringify(json)}`);
		return [];
	}
}

let infoPerSecond = [];

async function retrieveGuildInfo(g, msg) {
	const startTime = new Date();
	infoPerSecond.push(startTime);
	infoPerSecond = infoPerSecond.filter(
		ips => ips.getTime() + 1000 > new Date().getTime()
	);

	let prefix = g ? "ip!" : "";
	const options = [
		/*o.deleteOriginal(1000)*/
	];
	let disabledCommands = [];
	let rankmojis = [];
	let rankmojiChannel = "";
	let nameScreening = [];
	let allPastebin = {};
	let logging = false;
	let speedrun;
	let unknownCommandMessages = true;
	let failedPrecheckMessages = true;
	let permReplacements = {};
	let channelSpacing = false;
	const events = { welcome: "", goodbye: "" };
	if (g) {
		const guild = (await knex("guilds").where({ id: g.id }))[0];
		if (!guild) {
			await knex("guilds").insert({ id: g.id, prefix: prefix });
		} else {
			prefix = guild.prefix;
			allPastebin = tryParse(guild.searchablePastebins) || allPastebin;
			if (guild.quotes) {
				allPastebin.quote = guild.quotes;
			}
			speedrun = guild.speedrun;
			disabledCommands =
				tryParse(guild.disabledCommands) || disabledCommands;
			rankmojis = tryParse(guild.rankmojis) || rankmojis;
			rankmojiChannel = guild.rankmojiChannel;
			nameScreening = tryParse(guild.nameScreening) || nameScreening;
			permReplacements =
				tryParse(guild.permreplacements) || permReplacements;
			logging = guild.logging === "true" ? true : false;
			unknownCommandMessages =
				guild.unknownCommandMessages === "true" ||
				!guild.unknownCommandMessages
					? true
					: false;
			failedPrecheckMessages =
				guild.failedPrecheckMessages === "true" ||
				!guild.failedPrecheckMessages
					? true
					: false;
			channelSpacing = guild.channel_spacing === "true" ? true : false;
			events.welcome = guild.welcome || events.welcome;
			events.goodbye = guild.goodbye || events.goodbye;
		}
	}
	return {
		prefix: prefix,
		options: options,
		msg: msg,
		db: knex,
		pm: !g,
		allPastebin: allPastebin,
		disabledCommands: disabledCommands,
		rankmojis: rankmojis,
		rankmojiChannel: rankmojiChannel,
		nameScreening: nameScreening,
		logging: logging,
		speedrun: speedrun,
		unknownCommandMessages: unknownCommandMessages,
		permReplacements: permReplacements,
		events: events,
		embed: true,
		failedPrecheckMessages: failedPrecheckMessages,
		channelSpacing: channelSpacing,
		startTime: startTime,
		infoPerSecond: infoPerSecond.length
	};
}

function updateActivity() {
	const count = bot.guilds.size;
	bot.user.setActivity(`ip!help on ${count} servers`);
	// if(process.env.NODE_ENV === "development") return; // only production should post
	// let options = {
	// 	url: `https://bots.discord.pw/api/bots/${config.bdpid}/stats`,
	// 	headers: {
	// 		Authorization: config["bots.discord.pw"]
	// 	},
	// 	json: {
	// 		server_count: count // eslint-disable-line camelcase
	// 	}
	// };
	// request.post(options, (er, res) => {});
}

bot.on("ready", async () => {
	global.console.log("Ready");
	// bot.user.setActivity(`Skynet Simulator ${(new Date()).getFullYear()+1}`);
	updateActivity();
});

setInterval(updateActivity, 60 * 60 * 1000);

function streplace(str, eplace) {
	Object.keys(eplace).forEach(key => {
		str = str.split(key).join(eplace[key]);
	});
	return str;
}

bot.on("guildMemberAdd", async member => {
	// serverNewMember // member.toString gives a mention that's cool
	const info = await retrieveGuildInfo(member.guild);
	const nameParts = info.nameScreening.filter(
		screen =>
			member.displayName.toLowerCase().indexOf(screen.toLowerCase()) > -1
	);
	if (nameParts.length > 0) {
		// if any part of name contiains screen
		if (member.bannable) {
			member.ban(
				`Name contains dissallowed words: ${nameParts.join`, `}`
			);
			if (info.logging) {
				try {
					guildLog(
						member.guild.id,
						`[${moment().format("YYYY-MM-DD HH:mm:ss Z")}] Banned ${
							member.displayName
						} because their name contains ${nameParts.join`, `}`
					);
				} catch (e) {
					throw e;
				}
			}
		} else {
			console.log("COULD NOT BAN MEMBER MUST TELL SOMEONE");
		}
	}
	if (info.events.welcome) {
		setTimeout(
			() =>
				member.guild.systemChannel.send(
					streplace(info.events.welcome, {
						"@s": member.toString(),
						"%s": member.displayName
					})
				),
			1000
		);
	}
});

bot.on("guildMemberRemove", async member => {
	const info = await retrieveGuildInfo(member.guild);
	if (info.events.goodbye) {
		member.guild.systemChannel.send(
			streplace(info.events.goodbye, {
				"@s": member.toString(),
				"%s": member.displayName
			})
		);
	}
});

bot.on("channelCreate", async newC => {
	const info = await retrieveGuildInfo(newC.guild);
	if (info.channelSpacing) {
		newC.setName(newC.name.split("-").join(" "));
	}
});

bot.on("channelUpdate", async (old, newC) => {
	const info = await retrieveGuildInfo(newC.guild);
	if (info.channelSpacing) {
		newC.setName(newC.name.split("-").join(" "));
	}
});

async function checkMojiPerms(msg, info) {
	// if user.hasPerm(nitro custom emojis) && user.isNitro) {//bypass emoji role check}
	// Discord doesn't give this information to bot accounts :(
	let mojimsg = msg.cleanContent;
	const noPermMojis = [];
	const noPermMojiReason = [];
	info.rankmojis.forEach(({ rank, moji }) => {
		if (msg.cleanContent.indexOf(moji) > -1) {
			if (!msg.member.roles.has(rank)) {
				mojimsg = mojimsg.split(moji).join(`[no perms]`);
				noPermMojis.push(moji);
				if (msg.guild.roles.get(rank)) {
					noPermMojiReason.push(msg.guild.roles.get(rank).name);
				} else {
					noPermMojiReason.push("a rank that doesn't exist");
				}
			}
		}
	});
	if (mojimsg !== msg.cleanContent) {
		await msg.delete();
		const response = await msg.reply(
			`You do not have permission to use the emoji${
				noPermMojis.length === 1 ? "" : "s"
			}: ${noPermMojis.join`, `}. You need <${noPermMojiReason.join`>, <`}> to do that`
		);
		response.delete(10 * 1000);
		const themsg = await msg.reply(mojimsg);
		themsg.delete(20 * 1000);
		return false;
	}
	return true;
}

function logMsg({ msg, prefix }) {
	if (msg.guild) {
		devlog(
			`${prefix}< [${msg.guild.nameAcronym}] <#${msg.channel.name}> \`${msg.author.tag}\`: ${msg.content}`
		);
	} else {
		devlog(`${prefix}< pm: ${msg.author.tag}: ${msg.content}`);
	}
}

async function guildLog(id, log) {
	await fs.appendFile(
		path.join(__dirname, `logs/${id}.log`),
		`${log}\n`,
		"utf8"
	);
}

bot.on("message", async msg => {
	if (msg.author.id === bot.user.id) {
		devlog(`i> ${msg.content}`);
	}
	if (msg.author.bot) {
		return;
	}
	logMsg({ prefix: "I", msg: msg });
	// right here do if(prefix)
	const info = await retrieveGuildInfo(msg.guild, msg);
	if (info.logging) {
		try {
			guildLog(
				msg.guild.id,
				`[${moment().format("YYYY-MM-DD HH:mm:ss Z")}] <#${
					msg.channel.name
				}> \`${msg.author.tag}\`: ${msg.content}`
			);
		} catch (e) {}
	}
	const handle = async prefixlessMessage => {
		mostRecentCommands.push({
			content: msg.cleanContent,
			date: new Date()
		});
		while (mostRecentCommands.length > 5) {
			mostRecentCommands.shift();
		}

		let output;

		const outerUsage = new Usage({});
		outerUsage.add("", usage);
		Object.keys(info.allPastebin).forEach(spb =>
			outerUsage.add(spb, handleQuote(spb))
		);
		info.commands = outerUsage;

		try {
			output = await outerUsage.parse(info, prefixlessMessage);
		} catch (er) {
			let error = "";
			if (er instanceof DiscordAPIError) {
				error = `The error is: ${er.message} (error code ${er.code})`;
			}
			try {
				await msg.reply(
					`❌ Error: An internal error occured while attempting to run this command. ${error}`
				);
			} catch (errr) {
				await msg.author.send(
					`❌ Error: An error occured while running your command. Additionally, an error occured while trying to tell you about it... Maybe I'm not allowed to talk? ${error}`
				);
			}
			throw er; // To make sure I know of its existance
		}

		if (output.type !== "success") {
			// TODO note this will change to like output.notFound or output.preCheckFailed or something
			let resChannel = msg.channel;
			if (output.type === "notFound" && !info.unknownCommandMessages) {
				if (!o.perm("MANAGE_GUILD")(info)) {
					return;
				}
				resChannel = msg.author;
			}
			if (
				output.type === "preCheckFailed" &&
				!info.failedPrecheckMessages
			) {
				if (!o.perm("MANAGE_GUILD")(info)) {
					return;
				}
				resChannel = msg.author;
			}
			const mb = MB();
			mb.title.tag`❌ Error:`;
			mb.description.putRaw(output.defaultMessage); // WARNING this could potentionally ping people if mis set. Don't allow user input in outputs
			// const resEmbed = new RichEmbed;
			// resEmbed.description = output;
			// resEmbed.title = "❌ Error:";
			// msg.reply("", {embed: resEmbed});
			return await resChannel.send(...mb.build(info.embed));
		}
		return true;
	};

	const newInfo = new Info(msg, {
		startTime: info.startTime,
		infoPerSecond: info.infoPerSecond
	});
	// await newInfo.setup(knex)
	const messageRouter = new Router();
	messageRouter.add(info.prefix, [], router); // prefixCommand
	messageRouter.add(bot.user.toString(), [], router); // @botCommand

	try {
		messageRouter.handle(msg.content, newInfo);
	} catch (er) {
		msg.reply(
			"An internal error occured :( maybe try again? If that doesn't work, submit a bug report on the support server in `about` or gitlab page."
		);
		throw er;
	}

	// if(msg.cleanContent.startsWith(info.prefix)) {
	// 	let prefixlessMessage = msg.cleanContent.replace(info.prefix, "").trim(); // replace without regex just replaces the first instance
	// 	handle(prefixlessMessage);
	// }else if(msg.mentions.members.array().map(member => member.id).indexOf(bot.user.id) > -1) {
	// 	let prefixlessMessage = msg.cleanContent.split(`@${msg.guild.me.displayName}`).join``.trim();
	// 	handle(prefixlessMessage);
	// }
	// right here do if(moji)
	if (!(await checkMojiPerms(msg, info))) {
		return;
	}
	// if(msg.channel.id === info.rankmojiChannel) {
	//   info.rankmojis.forEach(({rank, moji}) => {
	//     msg.react(msg.guild.emojis.get(moji.split`:`[2].replace(/[^0-9]/g, "")) || moji);
	//   });
	// }
});

bot.on("messageUpdate", async (from, msg) => {
	if (msg.author.bot) {
		return;
	}
	logMsg({ prefix: "Eo", msg: from });
	logMsg({ prefix: "E2", msg: msg });
	const info = await retrieveGuildInfo(msg.guild, msg);
	if (info.logging) {
		try {
			guildLog(
				msg.guild.id,
				`[${moment().format("YYYY-MM-DD HH:mm:ss Z")}] <#${
					from.channel.name
				}> \`${from.author.tag}\` Edited Message: ${from.content}`
			);
			guildLog(
				msg.guild.id,
				`[${moment().format("YYYY-MM-DD HH:mm:ss Z")}] <#${
					msg.channel.name
				}> \`${msg.author.tag}\` To: ${msg.content}`
			);
		} catch (e) {
			throw e;
		}
	}

	checkMojiPerms(msg, info);
});

function getEmojiKey(emoji) {
	return emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;
}

bot.on("raw", async event => {
	if (event.t !== "MESSAGE_REACTION_ADD") {
		return;
	}

	const { d: data } = event;
	const user = bot.users.get(data.user_id); // Not sure how there will ever be no user for an event but whatever
	if (!user) {
		return;
	}
	const channel = bot.channels.get(data.channel_id);
	if (!channel) {
		return;
	}
	let message;
	message = await channel.fetchMessage(data.message_id);
	if (!message.guild) {
		return;
	}
	const emojiKey = getEmojiKey(data.emoji);
	const reaction = message.reactions.get(emojiKey);

	bot.emit("messageReactionAddCustom", reaction, user, message);
});
const rolesToAddToMessages = {};

bot.on("messageReactionAddCustom", async (reaction, user, message) => {
	if (user.bot) {
		return;
	}
	// console.log(`R= ${reaction.emoji}`); // keeping this around because this isn't tested that well, if it crashes it might help // not keeping it around it'll be loud
	const emoji = reaction.emoji.toString();
	const info = await retrieveGuildInfo(message.guild);
	// if(info.logging) try{guildLog(msg.guild.id, `[${moment().format("YYYY-MM-DD HH:mm:ss Z")}] <#${message.channel.name}> \`${message.author.tag}\` Edited Message: ${from.content}`)}catch(e){console.log(e);} // no point
	const member = message.guild.member(user);
	if (message.channel.id !== info.rankmojiChannel) {
		return;
	}
	if (
		member.hasPermission("MANAGE_ROLES") &&
		message.guild.member(bot.user).hasPermission("MANAGE_ROLES")
	) {
		const delet = () => {
			if (rolesToAddToMessages[message.id]) {
				rolesToAddToMessages[message.id].reaxns.forEach(reaxn =>
					message.reactions.get(reaxn).remove()
				);
				delete rolesToAddToMessages[message.id];
			}
		};
		info.rankmojis.forEach(async ({ rank, moji }) => {
			if (moji !== emoji) {
				return;
			}
			if (!message.guild.roles.get(rank)) {
				return;
			}
			if (!rolesToAddToMessages[message.id]) {
				rolesToAddToMessages[message.id] = { roles: [], reaxns: [] };
			}
			rolesToAddToMessages[message.id].roles.push(rank);
			rolesToAddToMessages[message.id].reaxns.push(
				getEmojiKey((await message.react("✅")).emoji)
			); // after awaiting for something you should check if the conditions are still met
			setTimeout(delet, 10 * 1000);
		});
		if (emoji === "✅") {
			if (rolesToAddToMessages[message.id]) {
				rolesToAddToMessages[message.id].roles.forEach(async rolid => {
					const role = message.guild.roles.get(rolid);
					try {
						if (message.member.roles.get(rolid)) {
							return;
						}
						await message.member.addRole(role);
						if (role.mentionable) {
							// TODO if !mentionable mention
							await message.reply(`Ranked with ${role.name}`);
						} else {
							await message.reply(
								`Ranked with ${role.toString()}`
							);
						}
					} catch (e) {
						(await message.reply(
							`Could not rank, I need to be above the role you want me to rank with`
						)).delete(10 * 1000);
					}
				});
			}
		}
	}
});

bot.on("guildCreate", guild => {
	global.console.log(`_ Joined guild ${guild.name} (${guild.nameAcronym})`);
});

bot.on("guildDelete", guild => {
	// forget about the guild at some point in time
	global.console.log(`_ Left guild ${guild.name} (${guild.nameAcronym})`);
	// TODO delete info in db after leaving a guild
});

process.on("unhandledRejection", (reason, p) => {
	const finalMsg = `
Hey @everyone, there was an error

**Recent Commands:**
${mostRecentCommands.map(c => `\`${c.content}\` / ${moment(c.date).fromNow()}`)
	.join`\n`}

**Stacktrace**:
\`\`\`
${reason.stack}
\`\`\`
`;
	console.log(p);
	console.log(reason);
	console.log(finalMsg);
	try {
		const rept = config.errorReporting.split`/`;
		bot.guilds
			.get(rept[0])
			.channels.get(rept[1])
			.send(finalMsg); // TODO disable logging in production and instead show the 10 messages before here with this
	} catch (e) {
		console.log("Failed to report");
	}
	// application specific logging, throwing an error, or other logic here
});