// ==UserScript==
// @author          Long Hải
// @name            Xoay lật video youtube
// @name:en         Rotate flip youtube videos
// @version         0.1
// @description     Plugin Xoay video cho Youtube.
// @description:en  Rotate video plugin for Youtube.
// @namespace       https://github.com/longhai/userscript
// @match           *.youtube.com/watch?v=*
// @grant           none
// ==/UserScript==

(function () {
    'use strict';
    var $ = (...args) => document.querySelector.apply(document,args)

    function css_load(text) {
        var ret = {}
        for (var row of text.split(";")) {
            if (row != "") {
                var t = row.split(":")
                ret[t[0].trim()] = t[1].trim();
            }
        }
        return ret
    }

    function css_dump(obj) {
        var ret = ""
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret += `${key}:${obj[key]};`
            }
        }
        return ret
    }
    var $ytp = $(".html5-main-video")
    var $vc = $(".html5-video-player")
    var state = 0

    function rotate_vid() {
        var css = css_load($ytp.style.cssText)
        state = (state + 1) % 4
        if (css["transform"] == undefined) state = 1
        var deg = state * 90

        var x = state % 2 == 0 ? $ytp.clientWidth : $ytp.clientHeight
        var y = state % 2 == 1 ? $ytp.clientWidth : $ytp.clientHeight
        css.left = ~~(($vc.clientWidth - x * (y / $vc.clientHeight)) / 2) + "px"

        css["transform"] = `rotate(${deg}deg)`
        css["transform"] += ` scale(${$vc.clientHeight / y})`
        $ytp.style.cssText = css_dump(css)
    }

    function toggle_tans(el, repr) {
        var css = css_load(el.style.cssText)
        var t = css["transform"]
        if (t) {
            if (t.indexOf(repr) != -1) {
                css["transform"] = t.replace(repr, "")
            } else {
                css["transform"] += " " + repr
            }
        } else {
            css["transform"] = repr
        }
        el.style.cssText = css_dump(css)
    }

    function addbutton(html, options, onRight = true) {
        var p, push;
        if (onRight) {
            p = $(".ytp-right-controls")
            push = n => p.insertBefore(n, p.firstElementChild)
        } else {
            // left
            p = $(".ytp-left-controls")
            push = n => p.appendChild(n)
        }
        var b = $(".ytp-settings-button").cloneNode(true)
        b.innerHTML = html
        b.className = "ytp-button"
        push(b)
        if (options.click) b.addEventListener("click", options.click)
        if (options.css) b.style.cssText = options.css
        if (options.id) b.id = options.id
        if (options.title) b.title = options.title
        return void 0;
    }

    // rotate 90
    addbutton(`
    <svg viewBox="0 0 512 512" width="100%" height="100%"><path d="M252.314 19.957c-72.036.363-142.99 33.534-189.18 95.97-69.83 94.39-59.125 223.32 19.85 304.993l-37.238 50.332 151.22-22.613L174.35 297.42l-43.137 58.308c-44.08-54.382-47.723-133.646-4.16-192.53 30.676-41.466 77.863-63.504 125.758-63.753 16.344-.085 32.766 2.382 48.645 7.467l-6.963-46.55c-23.858-4.86-47.908-5.026-71.017-.997-59.232 7.322-113.994 39.918-148.157 91.215 35.65-65.89 103.774-105.918 176.043-107.744 1.673-.042 3.347-.063 5.023-.065 14.8-.01 29.748 1.596 44.597 4.905l48.608-7.268c-31.14-13.906-64.32-20.62-97.274-20.453zm212.93 22.055l-151.217 22.61 22.614 151.22 41.126-55.588c42.204 54.29 45.092 132.048 2.187 190.043-40.22 54.367-108.82 75.32-170.19 57.566l6.522 43.598c28.726 5.533 58.236 4.414 86.203-3.07 37.448-5.957 73.34-22.05 103.16-47.728-49.196 54.65-122.615 77.514-191.744 64.34l-55.8 8.344c99.03 43.7 218.402 14.77 285.51-75.938 69.13-93.445 59.34-220.743-17.483-302.53l39.114-52.866z" fill="#fff" fill-opacity="1" transform="translate(512, 0) scale(-1, 1) rotate(-420, 256, 256)"></path></svg>
    `, {
        click: rotate_vid,
        css: "fill:white;width:20px;margin-right:1rem;",
        id: "rotate",
        title: "Xoay 90°"
    })

    // flip horizintal
    addbutton(`
    <svg viewBox="0 0 512 512" width="100%" height="100%"><path d="M269.03 14.47c-110.473 1.825-290.752 92.88-243.5 450.5 0-210.674 118.628-315.626 181.814-315.626 41.72 0 70.595 34.945 73.812 102.75h-40.592l7.218 13.687 114.94 218.283 8.25 15.687 8.28-15.688 114.938-218.28 7.218-13.688H441.97C438.38 104.607 361.12 15.24 274.25 14.47c-1.717-.017-3.465-.03-5.22 0zm-4.592 44.593c85.555-1.117 146.173 75.667 148.687 211.718h57.313L371 459.657 271.53 270.78h65.595c-2.322-140.208-60.25-201.84-171.72-180.25 35.16-20.848 68.674-31.07 99.032-31.468z" fill="#fff" fill-opacity="1" transform="translate(512, 0) scale(-1, 1) rotate(-450, 256, 256)"></path></svg>
    `, {
        click() {
            if ($ytp.style.cssText.indexOf("transform") == -1)state = 0
            if (state % 2 == 1) toggle_tans($ytp, "rotateX(180deg)")
            else toggle_tans($ytp, "rotateY(180deg)")
        },
        css: "fill:white;width:20px;margin-right:1rem;",
        id: "horizintal",
        title: "Lật Ngang"
    })

    // flip vertical
    addbutton(`
    <svg viewBox="0 0 512 512" width="100%" height="100%"><path d="M269.03 14.47c-110.473 1.825-290.752 92.88-243.5 450.5 0-210.674 118.628-315.626 181.814-315.626 41.72 0 70.595 34.945 73.812 102.75h-40.592l7.218 13.687 114.94 218.283 8.25 15.687 8.28-15.688 114.938-218.28 7.218-13.688H441.97C438.38 104.607 361.12 15.24 274.25 14.47c-1.717-.017-3.465-.03-5.22 0zm-4.592 44.593c85.555-1.117 146.173 75.667 148.687 211.718h57.313L371 459.657 271.53 270.78h65.595c-2.322-140.208-60.25-201.84-171.72-180.25 35.16-20.848 68.674-31.07 99.032-31.468z" fill="#fff" fill-opacity="1"></path></svg>

    `, {
        click() {
            if ($ytp.style.cssText.indexOf("transform") == -1)state = 0
            if (state % 2 == 0) toggle_tans($ytp, "rotateX(180deg)")
            else toggle_tans($ytp, "rotateY(180deg)")
        },
        css: "fill:white;width:20px;margin-right:1rem;",
        id: "vertical",
        title: "Lật đứng"
    })
})();
