// ==UserScript==
// @name         JUT.SU auto play,skips opening
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Rain
// @match        https://jut.su/*
// @grant        none
// ==/UserScript==

(async () => {

    const sleep = async msec => new Promise(r => setTimeout(r, msec));

    async function waitForInit() {
        while( typeof jQuery === "undefined" )
            await sleep(10);
    }
    await waitForInit();

    class Style {
        constructor(text, attach = false) {
            this.el = document.createElement("style");
            this.add(text);
            if ( attach )
                this.attach();
        }
        add(text) {
            this.el.innerHTML += "\n" + text + "\n";
        }

        get attached() { return document.body.contains(this.el) }

        attach() { this.attached || document.body.appendChild(this.el); }
        detach() { this.attached && document.body.removeChild(this.el); }
    }
    class ElControl {
        constructor(selector) {
            this.selector = selector;
        }
        get el() { return $(this.selector); }
        get isset() { return !!this.el.length; }
        get hidden() {
            const el = this.el;
            const bbox = el[0].getBoundingClientRect();
            return el.hasClass("vjs-hidden") || !(bbox.width && bbox.height)
        }
        get clicked() { return this.isset && !this.hidden }

        click() { this.el.click(); }
    }

    async function skipOpeningAndDoNext(elSkipOpening, elNext) {
         while(1) {
             if ( elSkipOpening.clicked ) {
                 elSkipOpening.click();
                 await sleep(3e3);
             }

             if ( elNext.clicked ) {
                 let href = getHrefNext();
                 if ( href ) {
                     if ( isFullScreen() )
                         href += "#fullscreen";
                     location.href = href;
                 }

                 return;
             }

             await sleep(300);
         }
    }
    async function firstPlayStart() {
        while( !elFirstPlay.clicked )
            await sleep(200);
        elFirstPlay.click();
    }

    const elPlayer = new ElControl("#my-player");

    const elFullScreen = new ElControl(".vjs-fullscreen-control.vjs-control.vjs-button");
    const elFullScreenChild = new ElControl(".vjs-fullscreen-control.vjs-control.vjs-button .vjs-icon-placeholder");
    async function firstDoFullScreen() {
        styleEmuFullScreen.attach();
    }
    function isFullScreen() {
        return document.fullscreen || styleEmuFullScreen.attached;
    }
    function getHrefNext() {
        return $(".there_is_link_to_next_episode").attr("href");
    }

    const elFirstPlay = new ElControl(".vjs-big-play-button");
    const elPlay = $(".vjs-play-control.vjs-control.vjs-button.vjs-paused");
    const elPauseOrPlay = $(".vjs-play-control.vjs-control.vjs-button.vjs-playing");

    const elSkipOpening = new ElControl(".vjs-overlay.vjs-overlay-bottom-left.vjs-overlay-skip-intro.vjs-overlay-background")
    const elNext = new ElControl(".vjs-overlay.vjs-overlay-bottom-right.vjs-overlay-skip-intro.vjs-overlay-background");

    const styleEmuFullScreen = new Style(`
		.main.wrapper {
			z-index: auto;
		}

		#my-player {
			position: fixed;
			left: 0px;
			top: 0px;
			z-index: 9999;
			width: 100%;
			height: 100%;
		}

		body {
			overflow: hidden;
		}
	`);

    while(![elPlayer, elFullScreenChild].every(e => e.isset))
        await sleep(100);


    elFullScreenChild.el.on("click.emu", () => {
        const ret = !styleEmuFullScreen.attached;
        styleEmuFullScreen.detach();
        elFullScreenChild.el.off("click.emu");
        return ret;
    });

    skipOpeningAndDoNext(elSkipOpening, elNext);
    firstPlayStart();
    if ( /fullscreen/i.test(location.hash) )
        firstDoFullScreen();

})();
