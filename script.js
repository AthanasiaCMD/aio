const platformScrapers = {
    tiktok: [
        async (url) => {
            const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.code === 0 && data.data) {
                return {
                    platform: "TikTok",
                    title: data.data.title || "TikTok Video",
                    author: data.data.author?.nickname || "@tiktok",
                    thumb: data.data.cover,
                    links: [
                        { label: "Download Tanpa Watermark", url: data.data.play, primary: true },
                        { label: "Download Musik (MP3)", url: data.data.music, primary: false }
                    ]
                };
            }
            throw new Error("TikWM failed");
        },
        async (url) => {
            const res = await fetch(`https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data?.data?.videos?.[0]) {
                const v = data.data.videos[0];
                return {
                    platform: "TikTok",
                    title: v.title,
                    author: v.author.nickname,
                    thumb: v.cover,
                    links: [
                        { label: "Download Tanpa Watermark", url: v.play, primary: true },
                        { label: "Download Musik (MP3)", url: v.music, primary: false }
                    ]
                };
            }
            throw new Error("TikTok Backup failed");
        }
    ],

    youtube: [
        async (url) => {
            const res = await fetch(`https://api.cobalt.tools/api/json`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ url: url })
            });
            const data = await res.json();
            if (data.status === "stream" || data.status === "redirect") {
                return {
                    platform: "YouTube",
                    title: "YouTube Video",
                    author: "YouTube Creator",
                    thumb: "https://via.placeholder.com/150", 
                    links: [
                        { label: "Download Video / Audio", url: data.url, primary: true }
                    ]
                };
            }
            throw new Error("Cobalt YouTube failed");
        }
    ],

    twitter: [
        async (url) => {
            const res = await fetch(`https://api.cobalt.tools/api/json`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ url: url })
            });
            const data = await res.json();
            if (data.status === "stream" || data.status === "redirect") {
                return {
                    platform: "Twitter / X",
                    title: "Twitter Media",
                    author: "@x_user",
                    thumb: "https://via.placeholder.com/150",
                    links: [
                        { label: "Download Video Twitter", url: data.url, primary: true }
                    ]
                };
            }
            throw new Error("Twitter scraper failed");
        }
    ],

    rednote: [
        async (url) => {
            const res = await fetch(`https://api.cobalt.tools/api/json`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ url: url })
            });
            const data = await res.json();
            if (data.status === "stream" || data.status === "redirect") {
                return {
                    platform: "RedNote (Xiaohongshu)",
                    title: "RedNote Media",
                    author: "RedNote User",
                    thumb: "https://via.placeholder.com/150",
                    links: [
                        { label: "Download Media RedNote", url: data.url, primary: true }
                    ]
                };
            }
            throw new Error("RedNote scraper failed");
        }
    ]
};

function detectPlatform(url) {
    if (url.includes("tiktok.com") || url.includes("douyin.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
    if (url.includes("xiaohongshu.com") || url.includes("xhslink.com")) return "rednote";
    return null;
}

async function handleDownload() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const resultContainer = document.getElementById('resultContainer');
    
    if (!urlInput) {
        showStatus("Masukkan URL video terlebih dahulu!", "error");
        return;
    }

    const platform = detectPlatform(urlInput);
    if (!platform) {
        showStatus("Platform tidak didukung! Masukkan link TikTok, YouTube, Twitter, atau RedNote.", "error");
        return;
    }

    resultContainer.classList.add('hidden');
    showStatus(`Mendeteksi link ${platform}...`, "loading");
    
    const scrapers = platformScrapers[platform];
    let successData = null;

    for (let i = 0; i < scrapers.length; i++) {
        try {
            showStatus(`Mencoba server ${platform} (${i + 1})...`, "loading");
            successData = await scrapers[i](urlInput);
            if (successData) break;
        } catch (err) {
            console.warn(`Scraper ${platform} ${i + 1} error:`, err.message);
        }
    }

    if (successData) {
        showStatus("Berhasil mendapatkan link download!", "success");
        displayResult(successData);
    } else {
        showStatus("Semua server gagal memproses link ini. Coba beberapa saat lagi.", "error");
    }
}

function displayResult(data) {
    document.getElementById('videoTitle').innerText = data.title;
    document.getElementById('videoAuthor').innerText = data.platform + " • " + data.author;
    document.getElementById('videoThumb').src = data.thumb;

    const actionContainer = document.getElementById('actionButtons');
    actionContainer.innerHTML = "";

    data.links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = "_blank";
        a.className = `btn-dl ${link.primary ? 'primary' : 'secondary'}`;
        a.innerHTML = `<i class="fa-solid fa-circle-down"></i> ${link.label}`;
        actionContainer.appendChild(a);
    });

    document.getElementById('resultContainer').classList.remove('hidden');
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.innerText = message;
    statusEl.className = `status-message ${type}`;
}
