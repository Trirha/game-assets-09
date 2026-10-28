window.onload = async () => {
  const video = document.getElementById("video");
  const loading = document.getElementById("loading");
  const data = document.getElementById("data");

  const error = (message) => {
    loading.innerText = message;
    throw message;
  };

  const pick = (array) => array[Math.floor(Math.random() * array.length)];
  const hacked_statements = ["Yes", "Maybe", "Most Likely", "Highly Probable", "Potentially", "Unlikely But Still Possible", "Almost Certainly", "Definitely", "Absolutely"];

  try {
    const memes = [];
    const push = (tit, con, add) => memes.push(`${tit}: ${con}${add || ""}`);

    let step = 0;

    let fontSize = Math.min(window.innerHeight / 10, window.innerWidth / 10);
    data.style.fontSize = `${fontSize}px`;

    // Look up the visitor's own IP/location straight from CORS-enabled HTTPS services
    // (no third-party proxy). Every lookup has a timeout and failures are ignored, so the
    // page still works if the services are blocked or offline.
    const getJSON = async (url, ms = 4000) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        return res.ok ? await res.json() : null;
      } catch (e) {
        return null;
      } finally {
        clearTimeout(timer);
      }
    };

    const lookupIP = async () => {
      const a = await getJSON("https://ipwho.is/");
      if (a && a.success !== false && a.ip) {
        return {
          ip: a.ip,
          country: a.country, countryCode: a.country_code,
          region: a.region, regionCode: a.region_code,
          city: a.city, lat: a.latitude, lon: a.longitude,
          isp: a.connection && (a.connection.isp || a.connection.org),
          as: a.connection && a.connection.asn ? `AS${a.connection.asn} ${a.connection.org || ""}`.trim() : null,
          timezone: a.timezone && a.timezone.id,
        };
      }
      const b = await getJSON("https://ipapi.co/json/");
      if (b && b.ip && !b.error) {
        return {
          ip: b.ip,
          country: b.country_name, countryCode: b.country_code,
          region: b.region, regionCode: b.region_code,
          city: b.city, lat: b.latitude, lon: b.longitude,
          isp: b.org, as: b.asn ? `${b.asn} ${b.org || ""}`.trim() : null,
          timezone: b.timezone,
        };
      }
      const c = await getJSON("https://api.ipify.org?format=json");
      return c && c.ip ? { ip: c.ip } : null;
    };

    const info = await lookupIP();

    const videoData = await fetch("video.mp4").catch(error);
    video.src = URL.createObjectURL(await videoData.blob());
    video.load();

    video.oncanplaythrough = async () => {
      loading.style.display = "none";
      start.style.display = "flex";

      if (info) {
        push("Haha", "Gottem");
        push("IP Address", info.ip);
        if (info.country) push("Country", `${info.country} (${info.countryCode})`);
        if (info.region) push("Region", `${info.region} (${info.regionCode})`);
        if (info.city) push("City", info.city);
        if (info.lat != null) push("Latitude", info.lat);
        if (info.lon != null) push("Longitude", info.lon);
        if (info.isp) push("ISP", info.isp);
        if (info.as) push("Autonomous System", info.as);
      } else {
        push("Haha", "Gottem");
      }
      push("User Agent", navigator.userAgent);
      push("Connection Method", "GET");
      push("Request URL", "/");
      push("Request Path", "/");
      push("Request Protocol", "https");
      push("Secure Connection", false ? "Yes" : "No");
      push("Proxy IPs", "[]");
      push("Referrer", document.referrer)
      push("Browser cookies", navigator.cookieEnabled)
      push("Browser online", navigator.onLine)
      push("Window Properies", Object.keys(window).length);
      push("Window Width", window.innerWidth, "px");
      push("Window Height", window.innerHeight, "px");
      push("Window Ratio", `${window.innerWidth / window.innerHeight}/1`);
      push("Screen Width", window.screen.availWidth, "px");
      push("Screen Height", window.screen.availHeight, "px");
      push("Screen Ratio", `${window.screen.availWidth / window.screen.availHeight}/1`);
      push("Screen Pixel Ratio", window.devicePixelRatio, "/1");
      push("Screen DPI", window.devicePixelRatio);
      push("Screen Color Depth", window.screen.colorDepth);
      push("Screen Orientation", `${window.screen.orientation.type} (${window.screen.orientation.angle}°)`);
      push("Screen Rotation", window.screen.orientation.angle);
      push("OS", `${navigator.platform}`);
      push("Available Browser Memory", typeof window.performance.memory != "undefined" ? Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) : null, "MB");
      push("CPU Threads", `${navigator.hardwareConcurrency}`);
      const canvas = document.createElement("canvas");
      let gl;
      let debugInfo;
      try {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      } catch (e) {}
      if (gl && debugInfo) {
        push("GPU Vendor", gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        push("GPU Info", gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
      push("Device Memory", `${navigator.deviceMemory}`);
      push("System Languages", navigator.languages.join(", "));
      push("Language", `${navigator.language}`);
      let date = new Date();
      push("Current Time", `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      if (info && info.timezone) push("Timezone", info.timezone);
      else push("Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
      push("Timezone Offset", date.getTimezoneOffset() / 60, " hours");
      push("Hacked", pick(hacked_statements));
      push("Stop playing", "Roblox");
      push("You are", "Cringe");
      push("Current Status", "\u{D9E}");
    };

    start.onclick = async () => {
      start.style.display = "none";
      video.style.display = "flex";
      video.play();

      const interval = setInterval(() => {
        const time = video.currentTime - 2.1 - (step * 60) / 132; // 132 bpm moment
        if (step >= memes.length) step = -Infinity;
        if (step < 0) return clearInterval(interval);
        if (time >= 0) {
          if (step == 0) document.title = info ? `lmao this you? [${info.ip}]` : "lmao this you?";
          const el = document.createElement("span");
          el.textContent = `${memes[step]}`;
          step++;
          data.appendChild(el);
          const height = data.getBoundingClientRect().height;
          if (height >= window.innerHeight) {
            fontSize *= 0.88;
            data.style.fontSize = `${fontSize}px`;
          }
        }
      }, 5);
    };

    video.onended = () => {
      video.style.display = "none";
      step = -Infinity;
    };
  } catch (e) {
    error(`${e.message}`);
  }
};
