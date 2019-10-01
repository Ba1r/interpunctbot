import Router from "commandrouter";
import Info from "../Info";
const router = new Router<Info, any>();

import { messages } from "../../messages";

router.add("ping", [], async (cmd: string, info) => {
	if (info.db ? await info.db.getFunEnabled() : true) {
	} else {
		return info.error(messages.fun.fun_disabled(info));
	}

	if (!info.other) {
		return await info.result("<a:pingpong:482012177725653003>", undefined);
	}
	await info.result(messages.fun.ping(info), undefined);
});

router.add("fun", [Info.theirPerm.manageBot], async (cmd: string, info) => {
	if (!info.db) {
		return info.error(messages.failure.command_cannot_be_used_in_pms(info));
	}
	if (cmd === "enable") {
		await info.db.setFunEnabled(true);
		return info.error(messages.fun.fun_has_been_enabled(info));
	} else if (cmd === "disable") {
		await info.db.setFunEnabled(false);
		return info.error(messages.fun.fun_has_been_disabled(info));
	}
	return info.error(messages.fun.command_not_found(info));
});

router.add("minesweeper", [], async (cmd: string, info) => {
	if (info.db ? await info.db.getFunEnabled() : true) {
	} else {
		return info.error(messages.fun.fun_disabled(info));
	}
	const words = cmd.split(" ");
	let difficulty: keyof (typeof dv) | undefined;
	let mode: string | undefined;
	let width: number | undefined;
	let height: number | undefined;
	let flag: boolean = false;
	const remainingWords = words.filter(word => {
		if (difficulties.indexOf(word as any) > -1) {
			difficulty = word as any;
			return false;
		}
		if (modesl.indexOf(word as any) > -1) {
			mode = word as any;
			return false;
		}
		if (word === "flag") {
			flag = true;
			return false;
		}
		const sizeMatch = word.match(/^([0-9]+)x([0-9]+)$/);
		if (sizeMatch) {
			width = Math.min(+sizeMatch[1], 25);
			height = Math.min(+sizeMatch[2], 25);
			return false;
		}
		return true;
	});
	difficulty = difficulty || "hard";
	mode = mode || "emojis";
	width = width || 10;
	height = height || 10;
	if (remainingWords.length > 0) {
		return await info.error(
			messages.fun.minesweeper_usage(info, difficulties, modesl)
		);
	}

	const generatedBoard = badMinesweeperGenerator({
		difficulty,
		mode,
		width,
		height,
		flag
	});

	// if (info.myChannelPerms ? info.myChannelPerms.has("EMBED_LINKS") : true) {
	// ...
	// }
	const linesUnder2000: string[] = [];
	const splitQuotedBoard = generatedBoard.split("\n").map(l => `> ${l}`);
	splitQuotedBoard.push(
		`**${width}**x**${height}** | theme: **${mode}** | difficulty: **${difficulty}** ${
			flag ? "flag" : ""
		}`
	);
	splitQuotedBoard.forEach(line => {
		const newLine = `${linesUnder2000[linesUnder2000.length - 1] ||
			""}\n${line}`; // puts an extra \n on the first line
		if (newLine.length < 1999) {
			linesUnder2000.pop();
			linesUnder2000.push(newLine);
		} else {
			linesUnder2000.push(line.substr(0, 1999));
		}
	});
	for (const line of linesUnder2000) {
		await info.channel.send(line);
	}
});

const dv = {
	easy: 10,
	medium: 15,
	hard: 20,
	veryhard: 25,
	epic: 30,
	ultra: 35
};
const difficulties: (keyof (typeof dv))[] = [
	"easy",
	"medium",
	"hard",
	"veryhard",
	"epic",
	"ultra"
];

const modesl = ["numbers", "customemojis", "emojis"];

const modes: {
	[key in (typeof modesl)[number]]: [
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string,
		string
	];
} = {
	numbers: [
		" ` ` ",
		" `1` ",
		" `2` ",
		" `3` ",
		" `4` ",
		" `5` ",
		" `6` ",
		" `7` ",
		" `8` ",
		" `X` "
	],
	customemojis: [
		"<:0:579074398296866823>",
		"<:1:579074398141677587>",
		"<:2:579074398611570698>",
		"<:3:579074398288347138>",
		"<:4:579074398615502858>",
		"<:5:579074398670028841>",
		"<:6:579074398418501667>",
		"<:7:579074398284414992>",
		"<:8_:579074398343004162>",
		"<:b_:579074398699651072>"
	],
	emojis: [
		"⬜",
		":one:",
		":two:",
		":three:",
		":four:",
		":five:",
		":six:",
		":seven:",
		":eight:",
		"💥"
	]
};

// why am I still using this code
const badMinesweeperGenerator = ({
	difficulty,
	mode,
	width,
	height,
	flag
}: {
	difficulty: keyof (typeof dv);
	mode: keyof (typeof modes);
	width: number;
	height: number;
	flag: boolean;
}) => {
	const v = modes[mode];
	const vals = v;
	//if(v === "custom") {vals = [0,1,2,3,4,5,6,7,8,9].map(i=>document.getElementById(i).value)}
	//else vals = JSON.parse(v);
	const w = width;
	const h = height;
	const b = dv[difficulty];
	const arr: number[][] = [];
	for (let y = 0; y < h; y++) {
		arr[y] = [];
		for (let x = 0; x < w; x++) {
			arr[y][x] = 0;
		}
	}
	for (let _ = 0; _ < b; _++) {
		arr[Math.floor(Math.random() * h)][Math.floor(Math.random() * w)] = 9;
	}
	arr[0][0] = 0;
	arr[1][0] = 0;
	arr[1][1] = 0;
	arr[0][1] = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const vta = arr[y][x] >= 9 ? 1 : 0;
			for (let t = Math.max(y - 1, 0); t <= Math.min(y + 1, h - 1); t++) {
				for (
					let s = Math.max(x - 1, 0);
					s <= Math.min(x + 1, w - 1);
					s++
				) {
					arr[t][s] += vta;
				}
			}
		}
	}
	return arr
		.map(
			el =>
				`||${el
					.map(e => vals[Math.min(e, 9)])
					.join(`${flag ? "||||;" : ""}||||`)}${
					flag ? "||||;" : ""
				}||`
		)
		.join(`\n`);
};

export default router;
