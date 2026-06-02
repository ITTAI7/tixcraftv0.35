import https from 'node:https';

async function fetchTix() {
  const urls = [
    "https://tixcraft.com/ticket/area/26_maydaytp/22474",
    "https://thingproxy.freeboard.io/fetch/https://tixcraft.com/ticket/area/26_maydaytp/22474",
    "https://api.allorigins.win/raw?url=https://tixcraft.com/ticket/area/26_maydaytp/22474"
  ];
  for (let url of urls) {
      console.log("Trying", url)
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        console.log("Status:", res.status);
      } catch (e: any) {
        console.log("Error:", e.message)
      }
  }
}
fetchTix();

