import * as Discord from "discord.js";

/*
So what does module do?
Router routes commands, module does...?

It holds a commandrouter, it has a method commandlist
I think module shouldn't exist and it should be replaced with Router

 */
import MB, { MessageBuilder } from "./MessageBuilder";
import Database from "./Database";

const result = {
	error: "<:failure:508841130503438356> Error: ",
	result: "",
	info: "<:info:508842207089000468> Info: ",
	success: "<:success:508840840416854026> Success: " // Discord uses a gray ✔️ emoji for some reason. It could be backslashed but some other platforms do too
};

const r = {
	manageBot: (info: Info) => {
		if (!r.pm(false)(info)) {
			return false;
		}
		if (info.authorPerms.manageBot) {
			return true;
		}
		return (
			info.error(
				"You need permisison to `Manage Server` to use this command",
				undefined
			) && false
		);
	},
	pm: (expected: boolean) => (info: Info) => {
		if (info.pm === expected) {
			return true;
		}
		return (
			info.error("This command cannot be used in a PM", undefined) &&
			false
		);
	} // I want an r.load() that calls startloading and awaits for it
};

export type MessageOptionsParameter =
	| Discord.MessageOptions
	| Discord.MessageEmbed
	| Discord.MessageAttachment;

export type MessageParametersType = [
	string,
	(MessageOptionsParameter) | undefined
];

export default class Info {
	loading: boolean;
	channel: Discord.TextChannel | Discord.DMChannel;
	guild?: Discord.Guild | null;
	message: Discord.Message;
	other: any;
	db?: Database;
	member?: Discord.GuildMember | null;
	constructor(message: Discord.Message, other: any) {
		this.loading = false;
		this.channel = message.channel;
		this.guild = message.guild;
		this.message = message;
		this.member = message.member;
		this.other = other;
		this.db = this.guild ? new Database(this.guild.id) : undefined;
	}
	static get result() {
		return result;
	}
	static get r() {
		return r;
	}
	get authorChannelPerms() {
		if (this.channel instanceof Discord.TextChannel) {
			return this.channel.permissionsFor(this.member!);
		}
		return undefined;
	}
	get myChannelPerms() {
		if (this.channel instanceof Discord.TextChannel) {
			return this.channel.permissionsFor(this.guild!.me!);
		}
		return undefined;
	}
	get authorPerms() {
		return {
			manageBot: this.authorChannelPerms
				? this.authorChannelPerms.has("MANAGE_GUILD")
				: true,
			manageChannel: this.authorChannelPerms
				? this.authorChannelPerms.has("MANAGE_CHANNELS")
				: true
		};
	}
	get pm() {
		return !this.guild;
	}
	async startLoading() {
		this.channel.startTyping();
	}
	async stopLoading() {
		this.channel.stopTyping();
	}
	_formatMessageWithResultType(
		type: string,
		message: string,
		options?: MessageOptionsParameter
	): MessageParametersType {
		// In the future maybe adjust richembeds maybe probably not
		return [type + message, options];
	}
	async _informMissingPermissions(
		perm: Discord.PermissionString,
		message: string,
		channel = this.channel
	) {}
	async _tryReply(
		content: string,
		options?:
			| Discord.MessageOptions
			| Discord.MessageEmbed
			| Discord.MessageAttachment
	): Promise<Discord.Message[] | undefined> {
		// returns the message
		if (content.length > 1999) {
			return this._tryReply("message too long"); // FIX, make it send multiple messages and return the last or somethignfdlkjk
		}

		if (this.pm || this.myChannelPerms!.has("SEND_MESSAGES")) {
			return <Discord.Message[]>await this.message.reply(content, {
				...options,
				split: true
			});
		}
		if (this.authorPerms.manageChannel) {
			// this._informMissingPermissions(SEND_MESSAGES, "reply to your message", this.message.author)
			// If the author has permission to manage the channel permissions, tell them the bot doesn't have permission to respond.
			const errorMessage = await this.message.author!.send(
				// how can a message not have an author
				...this._formatMessageWithResultType(
					result.error,
					`I do not have permission to reply to your message in #${
						this.channel instanceof Discord.TextChannel
							? this.channel.name
							: "this should never happen"
					}`
				)
			); // this.channel.name does not require antiformatting because channels are already not allowed to have @everyone or whatever
			errorMessage.delete({ timeout: 10 * 1000 }); // Don't await for this, you don't want to wait 10 seconds for it to delete do you
		}
		// Send the actual result
		return <Discord.Message[]>(<unknown>await this.message.author!.send(
			content,
			{
				...options,
				split: true
			}
		));
	}
	async reply(
		resultType: string,
		message: string | MessageBuilder | MessageParametersType,
		options?: MessageOptionsParameter | undefined
	) {
		let showErrors = this.db ? await this.db.getCommandErrors() : true;
		console.log("REMOVE THIS vvvvvv"); //TEMP
		showErrors = true;
		console.log("REMOVE THIS ^^^^^^"); //TEMP
		if (resultType === result.error && !showErrors) {
			if (!this.authorPerms.manageBot) {
				return; // command errors are disabled, return nothing
			}
		}

		// Stop any loading if it is happening, we're replying now we're done loading
		this.stopLoading(); // not awaited for because it doesn't matter

		// If the message is a messagebuilder, build the message builder
		if (message instanceof MessageBuilder) {
			message = message.build(true);
		} else if (typeof message === "string") {
			message = [message, options];
		}

		// Format the message with the correct result type
		message = this._formatMessageWithResultType(resultType, ...message);

		// Reply to the message (or author)
		return await this._tryReply(...message);
	}
	async error(...msg: MessageParametersType) {
		this.message.react("508841130503438356");
		console.log(
			"WHAT IF I DON'T HAVE PERMS TO ADD REACTIONS. also config.emoji"
		);
		const res = await this.reply(result.error, ...msg);
		res && res.forEach(r => r.delete({ timeout: 20 * 1000 }));
		return res;
	}
	async success(...msg: MessageParametersType) {
		this.message.react("508840840416854026");
		const res = await this.reply(result.success, ...msg);
		res && res.forEach(r => r.delete({ timeout: 20 * 1000 }));
		return res;
	}
	async result(...msg: MessageParametersType) {
		return await this.reply(result.result, ...msg);
	}
	async redirect(newcmd: string) {
		throw new Error("NOT IMPLEMENTED YET"); // TODO for example .wr is just .speedrun leaderboard 1, so it could res.redirect("speedrun leaderboard 1 "+arguments)
	}
}