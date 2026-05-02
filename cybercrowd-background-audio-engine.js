    }
  }

  function writeLastId(id) {
    try {
      sessionStorage.setItem(STORAGE_LAST, id);
    } catch (error) {
      // Ignore storage failure.
    }
  }

  function refillBag() {
    var ids = tracks.map(function (track) { return track.id; });
    var bag = shuffle(ids);
    var lastId = readLastId();

    if (bag.length > 1 && bag[0] === lastId) {
      var swap = bag[0];
      bag[0] = bag[1];
      bag[1] = swap;
    }

    writeBag(bag);
    return bag;
  }

  function nextFromBag() {
    var bag = readBag().filter(function (id) { return Boolean(byId[id]); });
    if (!bag.length) bag = refillBag();
    var id = bag.shift();
    writeBag(bag);
    return byId[id] || null;
  }

  function createAudio() {
    if (audio) return audio;

    audio = document.createElement("audio");
    audio.id = "cc-background-audio";
    audio.preload = "auto";
    audio.autoplay = true;
    audio.controls = false;
    audio.setAttribute("playsinline", "");
    audio.style.display = "none";

    audio.addEventListener("ended", function () {
      playTrack(nextFromBag());
    });

    audio.addEventListener("error", function () {
      playTrack(nextFromBag());
    });

    document.body.appendChild(audio);
    return audio;
  }

  function armGestureUnlock() {
    if (armed || unlocked) return;
    armed = true;

    var events = ["pointerdown", "touchend", "click", "keydown"];

    function unlock() {
      if (!audio || !audio.src) return;

      audio.play().then(function () {
        unlocked = true;
        events.forEach(function (name) {
          document.removeEventListener(name, unlock, true);
        });
      }).catch(function () {
        // Keep listeners armed until a browser-accepted gesture happens.
      });
    }

    events.forEach(function (name) {
      document.addEventListener(name, unlock, true);
    });
  }

  function playTrack(track) {
    if (!track || !track.url) return;

    createAudio();
    audio.src = track.url;
    audio.dataset.trackId = track.id;
    audio.dataset.trackTitle = track.title;
    writeLastId(track.id);

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(function () {
        unlocked = true;
      }).catch(function () {
        armGestureUnlock();
      });
    }
  }

  function themeAlreadyUsed() {
    if (!themeId) return true;
    try {
      return sessionStorage.getItem(STORAGE_THEME_DONE + themeId) === "1";
    } catch (error) {
      return false;
    }
  }

  function markThemeUsed() {
    if (!themeId) return;
    try {
      sessionStorage.setItem(STORAGE_THEME_DONE + themeId, "1");
    } catch (error) {
      // Ignore storage failure.
    }
  }

  function chooseOpeningTrack() {
    if (themeId && byId[themeId] && !themeAlreadyUsed()) {
      markThemeUsed();
      return byId[themeId];
    }
    return nextFromBag();
  }

  function install(list) {
    tracks = list.map(normalizeTrack).filter(function (track) {
      return track.id && track.url;
    });

    byId = {};
    tracks.forEach(function (track) {
      byId[track.id] = track;
    });

    if (!tracks.length) return;

    createAudio();
    playTrack(chooseOpeningTrack());
  }

  function boot() {
    if (Array.isArray(window.CYBERCROWD_TEASERS)) {
      install(window.CYBERCROWD_TEASERS);
      return;
    }

    fetch(manifestUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load teaser manifest");
        return response.json();
      })
      .then(install)
      .catch(function () {
        // Fail quiet. A missing manifest should not break the page.
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

Latest turn
