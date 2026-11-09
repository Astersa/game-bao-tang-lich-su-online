// Kết nối nhiều người.
// Thứ tự: Firebase (khi đã điền config.js) -> phòng chung claude.ai (khi mở bằng link claude.ai) -> một mình.
(function () {
  const listeners = new Set();
  const Net = {
    mode: "solo",        // "solo" | "firebase" | "claude"
    status: "solo",      // "solo" | "connecting" | "online"
    selfId: Math.random().toString(36).slice(2, 10),
    peers: new Map(),    // id -> trạng thái người khác (đã kiểm tra)
    onChange(fn) { listeners.add(fn); },
    update() {},         // được gán khi kết nối xong
  };
  const fire = (type, id) => { for (const fn of listeners) fn(type, id); };
  const num = (v) => typeof v === "number" && isFinite(v);
  const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, n) : "");

  // Dữ liệu từ người khác là không tin cậy: chỉ giữ các trường cần thiết, đúng kiểu.
  function clean(raw) {
    if (!raw || typeof raw !== "object" || !num(raw.x) || !num(raw.z) || !num(raw.yaw)) return null;
    return {
      x: Math.max(-40, Math.min(40, raw.x)),
      z: Math.max(-36, Math.min(64, raw.z)),
      yaw: raw.yaw,
      n: str(raw.n, 24) || "Khách",
      c: typeof raw.c === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.c) ? raw.c : "#d62828",
      m: raw.m === true,
      y: num(raw.y) ? Math.max(0, Math.min(9, raw.y)) : 0,
      say: str(raw.say, 80), sayAt: num(raw.sayAt) ? raw.sayAt : 0,
      emote: str(raw.emote, 12), emoteAt: num(raw.emoteAt) ? raw.emoteAt : 0,
      t: num(raw.t) ? raw.t : 0,
    };
  }
  function setPeer(id, raw) {
    if (id === Net.selfId) return;
    const s = clean(raw);
    if (!s) { removePeer(id); return; }
    const had = Net.peers.has(id);
    Net.peers.set(id, s);
    fire(had ? "update" : "join", id);
  }
  function removePeer(id) { if (Net.peers.delete(id)) fire("leave", id); }
  function setStatus(s) { Net.status = s; fire("status"); }
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("Không tải được " + src));
      document.head.appendChild(s);
    });
  }

  async function startFirebase(cfg, initial) {
    const v = "10.12.2";
    await loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-database-compat.js`);
    const app = firebase.initializeApp(cfg);
    const db = firebase.database(app);
    const TS = firebase.database.ServerValue.TIMESTAMP;
    const ref = db.ref((window.MUSEUM_ROOM || "bao-tang") + "/players");
    const me = ref.child(Net.selfId);
    let mine = { ...initial };
    let offset = 0;
    db.ref(".info/serverTimeOffset").on("value", (s) => { offset = s.val() || 0; });
    db.ref(".info/connected").on("value", (snap) => {
      if (snap.val() === true) {
        me.onDisconnect().remove();
        me.set({ ...mine, t: TS });
        setStatus("online");
      } else setStatus("connecting");
    });
    ref.on("child_added", (s) => setPeer(s.key, s.val()));
    ref.on("child_changed", (s) => setPeer(s.key, s.val()));
    ref.on("child_removed", (s) => removePeer(s.key));
    Net.update = (patch) => { mine = { ...mine, ...patch }; me.update({ ...patch, t: TS }).catch(() => {}); };
    setInterval(() => Net.update({}), 15000); // nhịp tim để biết ai còn online
    setInterval(() => { // bỏ "bóng ma" của người tắt máy đột ngột
      const now = Date.now() + offset;
      for (const [id, s] of Net.peers) if (s.t && now - s.t > 60000) removePeer(id);
    }, 10000);
    Net.mode = "firebase";
  }

  async function startClaude(initial) {
    const [room, user] = await Promise.all([window.claude.use("room"), window.claude.use("user")]);
    if (!room) return false;
    const names = {};
    room.onPeers((ch) => {
      const seen = new Set(); const ask = [];
      for (const p of ch.peers) {
        if (p.sameTab || p.kind !== "viewer") continue;
        seen.add(p.peer);
        const pr = { ...p.presence };
        if (!pr.n && p.by && names[p.by]) pr.n = names[p.by];
        if (p.by && !names[p.by]) ask.push(p.by);
        setPeer(p.peer, pr);
      }
      for (const id of [...Net.peers.keys()]) if (!seen.has(id)) removePeer(id);
      if (user && ask.length) user.profiles(ask).then((ps) => { for (const id of ask) if (ps[id] && ps[id].name) names[id] = ps[id].name; });
    }, () => { for (const id of [...Net.peers.keys()]) removePeer(id); Net.mode = "solo"; setStatus("solo"); });
    room.onConnection((c) => setStatus(c ? "online" : "connecting"));
    Net.update = (patch) => { room.presence(patch).catch(() => {}); };
    Net.update({ ...initial });
    Net.mode = "claude";
    return true;
  }

  Net.start = async function (initial) {
    try {
      const cfg = window.FIREBASE_CONFIG;
      if (cfg && cfg.databaseURL) { setStatus("connecting"); await startFirebase(cfg, initial); return; }
      if (window.claude && typeof window.claude.use === "function") {
        setStatus("connecting");
        if (await startClaude(initial)) return;
      }
    } catch (e) { console.warn("[Bảo tàng] Không kết nối được chế độ nhiều người:", e); }
    Net.mode = "solo"; setStatus("solo");
  };

  window.Net = Net;
})();
