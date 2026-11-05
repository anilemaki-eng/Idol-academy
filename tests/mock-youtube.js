// Stand-in for YouTube's IFrame Player API, for testing only (see CLAUDE.md).
// The real app never loads this file.
(function () {
  const S = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  window.__yt = { created: 0, destroyed: 0, players: [] };
  function Player(elId, opts) {
    const el = document.getElementById(elId);
    const iframe = document.createElement('iframe'); iframe.id = elId; iframe.src = 'about:blank'; el.replaceWith(iframe);
    const self = this; let time = 0, state = S.CUED, rate = 1, duration = window.__duration || 20, last = performance.now(), dead = false;
    const ev = opts.events || {};
    const fire = (n, d) => setTimeout(() => { if (!dead && ev[n]) ev[n]({ target: self, data: d }); }, 5);
    const tick = setInterval(() => { const now = performance.now();
      if (state === S.PLAYING) { time += (now - last) / 1000 * rate * (window.__timeScale || 1);
        if (time >= duration) { time = duration; state = S.ENDED; fire('onStateChange', S.ENDED); } }
      last = now; }, 10);
    this.videoId = opts.videoId;
    this.getAvailablePlaybackRates = () => (window.__mockRates || [0.25,0.5,0.75,1,1.25,1.5,1.75,2]).slice();
    this.setPlaybackRate = (r) => { if (r !== rate) { rate = r; fire('onPlaybackRateChange', r); } };
    this.getPlaybackRate = () => rate;
    this.playVideo = () => { if (state !== S.PLAYING) { state = S.PLAYING; last = performance.now(); fire('onStateChange', S.PLAYING); } };
    this.pauseVideo = () => { if (state === S.PLAYING) { state = S.PAUSED; fire('onStateChange', S.PAUSED); } };
    this.seekTo = (t) => { time = Math.max(0, Math.min(duration, t)); if (state === S.ENDED) { state = S.PAUSED; } };
    this.getCurrentTime = () => time; this.getDuration = () => duration; this.getPlayerState = () => state;
    this.destroy = () => { dead = true; clearInterval(tick); window.__yt.destroyed++; };
    window.__yt.created++; window.__yt.players.push(this);
    setTimeout(() => { if (!dead && ev.onReady) ev.onReady({ target: self }); }, 30);
  }
  window.YT = { Player, PlayerState: S };
  setTimeout(() => window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady(), 20);
})();
