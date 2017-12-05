const fs = require("fs");
const path = require("path");
const url = require("url");
const ytpl = require("ytpl");
const Downloader = require("./downloader");

const tracksFolder = path.resolve(__dirname, "tracks");
if (!fs.existsSync(tracksFolder)) {
    fs.mkdirSync(tracksFolder);
}

let playlists = [
    "https://www.youtube.com/watch?v=sQh7fr53Xy0&list=PLF6khONru0OyprOXsBZi2SqkGH81yXpms&index=28"
];

playlists.forEach(playlistUrl => {
    const playlistId = url.parse(playlistUrl, true).query.list;
    ytpl(playlistId, (err, playlist) => {
        if (err) throw err;

        const playlistInfo = {
            id: playlist.id,
            url: playlist.url,
            title: playlist.title
        };


        const playlistFolder = path.resolve(tracksFolder, playlistInfo.title);
        if (!fs.existsSync(playlistFolder)) {
            fs.mkdirSync(playlistFolder);
        }
        const downloader = new Downloader({
            ffmpegPath: path.resolve(__dirname, "ffmpeg", "ffmpeg.exe"),
            outputPath: playlistFolder
        });

        downloader.on("error", e => console.log(e));
        downloader.on("finished", (e, data) => {
            let db = JSON.parse(fs.readFileSync("db.json", "utf-8"));
            let dbPlaylistEntry = db.playlists.find(p => p.id === playlist.id);
            if (!dbPlaylistEntry) {
                dbPlaylistEntry = { id: playlist.id, tracks: [] };
                db.playlists.push(dbPlaylistEntry);
            }

            let trackEntry = dbPlaylistEntry.tracks.find(t => t.id === data.videoId);
            if (!trackEntry) {
                dbPlaylistEntry.tracks.push({videoId: data.videoId, videoTitle: data.videoTitle});
            }

            fs.writeFileSync("db.json", JSON.stringify(db));
        });

        // for (let [index, video] of playlist.items.entries()) {
        // downloader.download({playlist: playlistInfo, videoId: video.id, index: index + 1});
        let items = playlist.items;
        downloader.download({ playlist: playlistInfo, videoId: items[1].id, index: 1 });
        // }
    });
});