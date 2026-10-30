// YouTube helpers: reading a video's id from its link, and loading
// YouTube's official player (the "IFrame Player API").
App.youtube = (function () {
  let apiPromise = null;

  // 'https://youtu.be/h5CwaVjF_78?si=…' -> 'h5CwaVjF_78'
  // Works for youtu.be, youtube.com/watch?v=…, /shorts/…, /embed/…, /live/… links.
  // Returns null if the link doesn't point to one video.
  function videoId(link) {
    let url;
    try {
      url = new URL(link);
    } catch (e) {
      return null;
    }
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let id = null;
    if (host === 'youtu.be') {
      id = parts[0];
    } else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      if (parts[0] === 'watch') {
        id = url.searchParams.get('v');
      } else if (['shorts', 'embed', 'live', 'v'].indexOf(parts[0]) >= 0) {
        id = parts[1];
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  // Resolves to YouTube's YT object once its player code has loaded.
  // Rejects if it doesn't load within 20 seconds (for example, no internet).
  function loadApi() {
    if (window.YT && window.YT.Player) {
      return Promise.resolve(window.YT);
    }
    if (!apiPromise) {
      apiPromise = new Promise(function (resolve, reject) {
        const timer = setTimeout(function () {
          apiPromise = null; // let the next attempt try again
          reject(new Error('timeout'));
        }, 20000);
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          clearTimeout(timer);
          if (typeof previous === 'function') previous();
          resolve(window.YT);
        };
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = function () {
          clearTimeout(timer);
          apiPromise = null;
          script.remove();
          reject(new Error('load failed'));
        };
        document.head.appendChild(script);
      });
    }
    return apiPromise;
  }

  // What to tell you when YouTube reports an error code
  function errorMessage(code) {
    if (code === 101 || code === 150) {
      return "This video's owner doesn't allow it to play outside YouTube.";
    }
    if (code === 100) return 'This video was removed or made private.';
    if (code === 2) return "This link doesn't point to a YouTube video.";
    return "YouTube couldn't play this video here.";
  }

  return { videoId: videoId, loadApi: loadApi, errorMessage: errorMessage };
})();
