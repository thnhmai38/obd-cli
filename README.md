<h1 align="center">Osu! Beatmaps Downloader CLI</h1>
<h4 align="center">The CLI tool help to download osu! mirror beatmaps by Beatmap ID or Mapset ID
<br> <br>
<img src="https://img.shields.io/npm/dw/obd-cli"> <img src="https://img.shields.io/npm/v/obd-cli"> <img src="https://img.shields.io/snyk/vulnerabilities/npm/obd-cli"> <img src="https://img.shields.io/github/license/thanhgaming5550/obd-cli"> <img src="https://img.shields.io/github/repo-size/thanhgaming5550/obd-cli">
</h4>

## Installation: ```npm i obd-cli -g```
## Usage:
```
$ obd --help

Using "obd --help" for more information

Options:
      --help                 Show help                                 [boolean]
      --version              Show version number                       [boolean]
  -m, --mapset               One or More BeatmapSetID that need to download
                                                                         [array]
  -b, --beatmap              One or More BeatmapID that need to download [array]
  -p, --path                 The path to the storage location
                                     [string] [default: "$root"]
      --nvd, --noVideo       Not to download video    [boolean] [default: false]
      --nhs, --noHitsound    Not to download hitsound [boolean] [default: false]
      --nsb, --noStoryboard  Not to download storyboard
                                                      [boolean] [default: false]
      --nbg, --noBackground  Not to download background
                                                      [boolean] [default: false]
      --zip                  Name of file if you want to compress to .zip
                                                                        [string]
```

## Example: 
```
$ obd --beatmap 2290742 2802273 3311067 ffdfdfss 123456789 --mapset 1815474 1758789 783782121 --noVideo --nsb
```

## Resources:
- [Nerinyan](https://nerinyan.moe/)

## Demo:

https://user-images.githubusercontent.com/62001770/213357858-45cd43c1-6d3e-4d16-a4e0-ee11dd08fca2.mp4

## Notice:
This is my first CLI, so it may have some bugs. Please report at [here](https://github.com/thanhgaming5550/obd-cli/issues).

<br>
<b>Thanks for using my package!</b>
