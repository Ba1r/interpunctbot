import * as nr from "../NewRouter";
import { dgToDiscord } from "../parseDiscordDG";

nr.addDocsWebPage(
	"/help",
	"Help",
	"interpunct bot commands",
	`{Title|inter·punct bot}

{LinkSummary|/help/configuration}
{LinkSummary|/help/fun}
{LinkSummary|/help/ticket}
{LinkSummary|/help/emoji}
{LinkSummary|/help/messages}
{LinkSummary|/help/channels}
{LinkSummary|/help/administration}
{LinkSummary|/help/customcommands}
{LinkSummary|/help/log}
{LinkSummary|/help/speedrun}
{LinkSummary|/help/quickrank}
{LinkSummary|/help/autodelete}`,
);

nr.addDocsWebPage(
	"/index",
	"Home",
	"Website homepage",
	`{Title|Inter·punct Bot}
Interpunct is a discord bot developed by {Atmention|pfg#4865}

{LinkSummary|/help}

{Heading|Links}
{Link|https://top.gg/bot/433078185555656705}
{Link|https://discord.bots.gg/bots/433078185555656705}

{Screenshot|https://top.gg/api/widget/433078185555656705.png}`,
);

nr.addDocsWebPage(
	"/updates",
	"Updates",
	"bot updates",
	`{Heading|Bot Updates}

{LinkSummary|/updates/2020-07-30}
{LinkSummary|/updates/2020-03-12}
{LinkSummary|/updates/ipv3}`,
);

nr.addDocsWebPage(
	"/updates/2020-03-12",
	"update 2020-03-12",
	"update 2020-03-12",
	`{Title|Update 2020-03-12}

Adds a new two-player game
{CmdSummary|circlegame}

Adds a new fun command
{CmdSummary|award}`,
);

nr.addDocsWebPage(
	"/updates/2020-07-30",
	"update 2020-07-30",
	"update 2020-07-30",
	`{Title|2020-07-30}

Adds ticket stuff

{LinkSummary|/help/ticket}
{CmdSummary|randomword}`,
);

nr.addDocsWebPage(
	"/updates/ipv3",
	"ipv3 update",
	"ipv3 update",
	`{Title|2020-03-07, Interpunct version 3}

Adds many new things and improves the experience of some old things. There are still lots of messages that haven't been written yet or are slightly confusing, if you have any issues, ask on the {Link|https://interpunct.info/support|Support Server}.

{Heading|New Commands}
{LinkSummary|/help/quickrank}
{LinkSummary|/help/autodelete}
{CmdSummary|connect4}
{CmdSummary|remindme}
{CmdSummary|trivia}
{CmdSummary|minesweeper}
{CmdSummary|vote}
{CmdSummary|members}
{CmdSummary|slowmode set}
{CmdSummary|wr}
{CmdSummary|stats}

{Heading|Other Things}
The purge command is now significantly faster
This website is completely new.
Also there are lots of other minor changes.`,
);

nr.addDocsWebPage(
	"/404",
	"404",
	"Not found",
	"{Heading|Uh oh!}\n\n404 not found.",
);

nr.addErrorDocsPage("/errors/perm/manage-roles", {
	overview: "You need permission to Manage Roles to use this command.",
	detail:
		"This command requires that you have the Manage Roles permission to use it.",
	mainPath: "/errors/perm",
});

nr.addDocsWebPage(
	"/help/administration",
	"Administration",
	"commands to help administration",
	`{Title|Administration}

{Interpunct} has a few commands for helping with administration

{CmdSummary|purge}
{LinkSummary|/help/autoban}`,
);

nr.addDocsWebPage(
	"/help/autoban",
	"Autoban",
	"commands to automatically ban users",
	`{Title|Autoban}

{CmdSummary|autoban add}
{CmdSummary|autoban list}
{CmdSummary|autoban clear}`,
);

nr.addErrorDocsPage("/errors/help-path-not-found", {
	overview:
		"That help page could not be found. For all help, use {Command|help}",
	detail: "",
	mainPath: "/help/help/help",
});

/*
errors should look like this:

I don't understand the unit you provided.
Usage: `ip!remindme <when> [message]`
> Error Help: https://interpunct.info/errors/arg/duration/bad-unit
> Duration Help: https://interpunct.info/arg/duration
> Command Help: https://interpunct.info/help/fun/remindme

maybe even put it in an embed

first implement the error pairing thing so when the original message is deleted, the error goes away too

Error!
] body
] clean [links like this](https://)
footer: For more help, join the support server. https://interpunct.info/support

*/

nr.globalCommand(
	"/help/help/help", // hmm
	"help",
	{
		usage: "help {Optional|command}",
		description: "Bot help",
		examples: [],
	},
	nr.passthroughArgs,
	async ([cmd], info) => {
		const autoResolution = "/help/" + (cmd || "").split(" ").join("/");

		const docsPage =
			nr.globalDocs[cmd || "/help"] ||
			nr.globalDocs[autoResolution] ||
			nr.globalDocs[
				nr.globalCommandNS[cmd.toLowerCase()]?.docsPath || ""
			];
		if (docsPage) {
			const bodyText = dgToDiscord(docsPage.body, info);
			await info.result(
				// dgToDiscord(`{Var|bodyText}\n\n{Bold|Full Help}: {Link|${url}}`) // concept
				(
					bodyText +
					"\n\n" +
					"**Full Help**: <https://interpunct.info" +
					docsPage.path +
					">"
				).replace(/\n\n+/g, "\n\n"),
			);
		} else {
			await info.docs("/errors/help-path-not-found", "error");
		}
	},
);
