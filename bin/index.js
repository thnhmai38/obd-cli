#! /usr/bin/env node
//? Require Package
const yargs = require("yargs");
const fs = require("fs");
const {hideBin} = require('yargs/helpers');
const yargv = yargs(hideBin(process.argv));
const _cliProgress = require("cli-progress")
const request = require("request");
const path = require("path");
const archiver = require('archiver');
const fetch = require("node-fetch");
const chalk = require('chalk')

//? Preparing Variables and CLI
var failed_beatmap = [], unfound_beatmap = [], unfound_beatmapSet = [], success_beatmap = [], count=0, beatmap = new Array;
const prefix = "obd";
const usage = `\nUsing "${prefix} --help" for more information`;
const options = yargs
    .usage(usage)
    .option("m", {
        alias: "mapset",
        describe: "One or More BeatmapSetID that need to download",
        type: "array",
        demandOption: false
    })
    .option("b", {
        alias: "beatmap",
        describe: "One or More BeatmapID that need to download",
        type: "array",
        demandOption: false
    })
    .option("p", {
        alias: "path",
        describe: "The path to the storage location",
        type: "string",
        default: process.cwd()
    })
    .option("nvd", {
        alias: "noVideo",
        describe: "Not to download video",
        demandOption: false,
        type: "boolean",
        default: false
    })
    .option("nhs", {
        alias: "noHitsound",
        describe: "Not to download hitsound",
        demandOption: false,
        type: "boolean",
        default: false
    })
    .option("nsb", {
        alias: "noStoryboard",
        describe: "Not to download storyboard",
        demandOption: false,
        type: "boolean",
        default: false
    })
    .option("nbg", {
        alias: "noBackground",
        describe: "Not to download background",
        demandOption: false,
        type: "boolean",
        default: false
    })
    .option("zip", {
        describe: "Name of file if you want to compress to .zip",
        demandOption: false,
        type: "string",
    })
    .argv;

//? Getting Data
const args = yargv.argv;
const rawbeatmapSet = args.mapset || new Array;
const rawbeatmap = args.beatmap || new Array;
const locate = args.path || process.cwd();
const video = !args.noVideo;
const storyboard = !args.noStoryboard;
const background = !args.noBackground;
const hitsound = !args.noHitsound;
const packed = args.zip;
if (packed!==undefined) packed.replace(/[/\\?%*:|"<>]/g, ' ');

//return console.info(args);

//? Exception check
if (rawbeatmap.length == 0 && rawbeatmapSet.length==0) {
    return console.error(chalk.red(`Missing beatmap to download ${usage}`));
}
if (locate === path.basename(locate)) {
    return console.error(chalk.red(`"${locate}" is not a vaild path! ${usage}`));
}

//? Preparing SubFunction
const clearConsoleLine = (line) => {
    process.stdout.moveCursor(0, -line) // up one line
    process.stdout.clearLine(line) // from cursor to end
}
const pingNerinyan = async () => {
    let result;
    await fetch(`https://api.nerinyan.moe/health`)
        .then((res) => {
            if (res.ok) result = true;
        })
        .catch(() => {
            result = false;
        })
    return result;
}
async function search(query) {
    let result;
    await fetch(`https://api.nerinyan.moe/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(res => {result = res})
    return result;
}
async function scan(string, type) {
    let id = parseInt(Number(string), 10);
    if (isNaN(id)) {
        if (type==1) {
            unfound_beatmapSet.push(string);
        } else {
            unfound_beatmap.push(string);
        }
        return console.log(chalk.red(`"${string}" is not a vaild ${type==1 ? "BeatmapSetID" : "BeatmapID"}`));
    }
    const result = await search(string);
    if (!Array.isArray(result)) {
        if (type==1) {
            unfound_beatmapSet.push(id);
        } else {
            unfound_beatmap.push(id);
        }
        return console.log(chalk.red(`${id}: There is no ${type==1 ? "BeatmapSet" : "Beatmap"} on database`))
    }
    switch (type) {
        case 1:
            for (const bm of result) {
                if (bm.id == id) {
                    console.log(chalk.green(id + ": " + bm.artist + " - " + bm.title))
                    return beatmap.push(bm);
                }
                //console.log(bm.id);
            }
            console.log(chalk.red(`${id}: There is no BeatmapSet has this ID on database`))
            unfound_beatmapSet.push(id);
            break;
    
        default:
            for (const bm of result) {
                for (const diff of bm.beatmaps) {
                    if (diff.id == id) {
                        console.log(chalk.green(id + ` -> ${bm.id}: ` + bm.artist + " - " + bm.title))
                        return beatmap.push(bm);
                    }
                    //console.log(diff.id);
                }
            }
            console.log(chalk.red(`${id}: There is no Beatmap has this ID on database`))
            unfound_beatmap.push(id);
            break;
    }
}
const download = (filename, id) => {
    return new Promise((resolve, reject) => {
        console.log(`Downloading Beatmap ${id}... (${count}/${beatmap.length})`);
        const progressBar = new _cliProgress.SingleBar({
            format: '[{bar}] {percentage}% | Time Left: {eta}s'
        }, _cliProgress.Presets.shades_classic);
        const file = fs.createWriteStream(filename);
        let receivedBytes = 0

        request.get(`https://api.nerinyan.moe/d/${id}?noVideo=${!video}&noBg=${!background}&NoHitsound=${!hitsound}&NoStoryboard=${!storyboard}`)
            .on('response', (response) => {
                if (response.statusCode !== 200) {
                    reject(`Beatmap ${id} download falled!: ${response.statusCode}`)
                }
                const totalBytes = response.headers['content-length'];
                progressBar.start(totalBytes, 0);
            })
            .on('data', (chunk) => {
                receivedBytes += chunk.length;
                progressBar.update(receivedBytes);
            })
            .pipe(file)
            .on('log', (err) => {
                fs.unlink(filename);
                progressBar.stop();
                clearConsoleLine(2);
                reject(`Beatmap ${id} download falled!: ${err.message}`); 
            });

        file.on('finish', () => {
            progressBar.stop();
            file.close();
            clearConsoleLine(2);
            resolve(`Beatmap ${id} download successful!`); 
        });

        file.on('log', (err) => {
            fs.unlink(filename);
            progressBar.stop();
            clearConsoleLine(2);
            reject(`Beatmap ${id} download falled!: ${err.message}`); 
        });
    })
}
function zipFile() {
    const stream = fs.createWriteStream(`${locate}\\${packed}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 }});
    console.info(`Archiving into "${packed}.zip"...`)
    return new Promise((resolve, reject) => {
        archive
            .directory(`${locate}\\${packed}`, false)
            .on('error', err => reject(`Can't archive your file: ${err}\nYour directory will not be deleted!`))
            .pipe(stream);
    
        stream.on('close', () => resolve(`Archived into "${packed}.zip" file! (${archive.pointer() + ' total bytes'})`));
        archive.finalize();
    });
}
function deleteFolder() {
    console.info(`\nDeleting "${packed}" directory...`)
    return new Promise((resolve, reject) => {
        fs.rm(`${locate}\\${packed}`, {recursive: true} , (err) => {
            if (err) {
                reject(chalk.red("Can't delete directory: " + err));
            } else resolve(`Deleted "${packed}" directory!`);
        });
    })
}

//? Preparing MainFunction
function showMode() {
    console.info(chalk.bold(`\nDownloaded files will be stored at "${chalk.underline(`${locate}`)}". Any files with the same name will be OVERWRITTEN!\n`))
    console.info(`${chalk.yellow(`Storyboard:`)} ${storyboard ? chalk.green('YES') : chalk.red('NO')}`)
    console.info(`${chalk.yellow(`Background:`)} ${background ? chalk.green('YES') : chalk.red('NO')}`)
    console.info(`${chalk.yellow(`Hitsound:`)} ${hitsound ? chalk.green('YES') : chalk.red('NO')}`)
    console.info(`${chalk.yellow(`Video:`)} ${video ? chalk.green('YES') : chalk.red('NO')}`)
}
async function rawProcess() {
    for (string of rawbeatmap) {
        await scan(string, 2)
    }
    for (string of rawbeatmapSet) {
        await scan(string, 1)
    }
    console.log(`There are ${beatmap.length} beatmap(s) that need to download!`)
}
async function downloadBeatmap() {
    //? Downloading
    for (const bm of beatmap) {
        count++;
        await download(`${locate}\\${packed!==undefined ? packed + "\\" : ""}${`${bm.id} ${bm.artist} - ${bm.title}`.replace(/[/\\?%*:|"<>]/g, ' ') + ".osz"}`, bm.id)
            .then((log) => {
                success_beatmap.push(bm.id);
                console.info(chalk.green(log));
            })
            .catch((log) => {
                failed_beatmap.push(bm.id);
                console.info(chalk.red(log));
            })
    }

    //? Logging
    console.info(`\n\n${success_beatmap.length}/${beatmap.length} beatmap(s) downloaded successfuly! (${failed_beatmap.length} failed). ${unfound_beatmap.length} beatmap(s) not found`)
    if (success_beatmap.length>0) {
        console.info(chalk.green(`- Success: ` + success_beatmap.join(", ")))
    }
    if (failed_beatmap.length>0) {
        console.info(chalk.red(`- Failed: ` + failed_beatmap.join(", ")))
    }
    if (unfound_beatmapSet.length>0) {
        console.info(chalk.red(`- Not Found BeatmapSet: ` + unfound_beatmapSet.join(", ")))
    }
    if (unfound_beatmap.length>0) {
        console.info(chalk.red(`- Not Found Beatmap: ` + unfound_beatmap.join(", ")))
    }
}

//? Main Runner
async function run() {
    //? Showing mode using
    showMode()

    //? Prepare Packing
    if (packed !== undefined) {
        if (fs.existsSync(`${locate}\\${packed}`)) {
            await deleteFolder()
                .then((log) => {
                    console.info(log)
                })
        }
        fs.mkdirSync(`${locate}\\${packed}`);
        console.info(`\nCreate new "${packed}" directory for downloading`)
    }

    //? Ping
    if (await pingNerinyan() === false) return console.error(chalk.red("\nNerinyan-API is offline!")); else console.log(chalk.green("\nNerinyan-API is online!"))
    
    //? Fetching Beatmap
    console.info(chalk.bold(chalk.blue("\n[Fetching Beatmap]")))
    await rawProcess();

    //? Create Folder when not found
    if (!fs.existsSync(locate)){
        fs.mkdirSync(locate);
    }

    //? Downloading Beatmap
    if (beatmap.length>0) {
        console.info(chalk.bold(chalk.blue("\n[Downloading Beatmap]")))
        await downloadBeatmap();
    }

    //? Packing Beatmap
    if (packed !== undefined && success_beatmap.length>0) {
        console.info(chalk.bold(chalk.blue("\n[Packing Beatmap]")))
        await zipFile()
            .then(async (log) => {
                console.info(log)
                await deleteFolder()
                    .then(dellog => {
                        console.info(dellog)
                    })
                    .catch(dellog => {
                        console.info(dellog)
                    })
            })
    }
    
    if (success_beatmap.length>0) console.info(chalk.bold(`\nYour beatmap(s) are located at ${chalk.underline(`${locate}${packed!==undefined ? String.fromCharCode(92) + packed + ".zip" : ""}`)}`));
    console.info("");
}

process.on('uncaughtException', function (err) {
    console.log(chalk.red(err));
});

run();