// ==UserScript==
// @name         YouTube Rotate & Flip (Auto Hide) - Integrated Controls
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Xoay và lật video trên YouTube, nút điều khiển nằm bên trái thanh điều khiển bên phải của YouTube, tự động ẩn khi thanh điều khiển YouTube ẩn
// @author       Bạn
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Thêm Font Awesome nếu chưa có
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://site-assets.fontawesome.com/releases/v6.7.2/css/all.css';
    document.head.appendChild(fontAwesome);

    function addControls() {
        if (document.getElementById('rotate-controls')) return;

        const video = document.querySelector('video');
        if (!video) return;

        let rotation = 0, scaleX = 1;
        const controls = document.createElement('div');
        controls.id = 'rotate-controls';
        Object.assign(controls.style, {
            display: 'none',
            gap: '5px',
            flexWrap: 'wrap',
            background: 'transparent' // Làm nền trong suốt
        });

        function createBtn(iconClass, tooltip, onClick) {
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                padding: '10px', // Tăng kích thước nút
                fontSize: '18px', // Giảm độ đậm của biểu tượng
                fontWeight: 'normal', // Giảm độ đậm
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(0, 0, 0, 0)', // Màu nền trong suốt giống YouTube
                color: 'white',
                borderRadius: '5px',
                position: 'relative'
            });

            const icon = document.createElement('i');
            icon.className = iconClass;
            btn.appendChild(icon);

            btn.onclick = onClick;
            btn.onmouseenter = () => {
                btn.style.color = 'red';
                tooltipElem.style.display = 'block';
            };
            btn.onmouseleave = () => {
                btn.style.color = 'white';
                tooltipElem.style.display = 'none';
            };

            // Tạo tooltip giống YouTube
            const tooltipElem = document.createElement('div');
            tooltipElem.textContent = tooltip;
            Object.assign(tooltipElem.style, {
                position: 'absolute',
                bottom: '130%', // Đẩy ghi chú cao lên một chút
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '5px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                display: 'none',
                pointerEvents: 'none'
            });
            btn.appendChild(tooltipElem);
            return btn;
        }

        function updateTransform() {
            video.style.transform = `rotate(${rotation}deg) scaleX(${scaleX})`;
        }

        controls.append(
            createBtn('fa-regular fa-arrow-rotate-left', 'Xoay 90° trái', () => { rotation = (rotation - 90 + 360) % 360; updateTransform(); }),
            createBtn('fa-regular fa-arrows-left-right', 'Lật ngang', () => { scaleX *= -1; updateTransform(); })
        );

        const ytRightControls = document.querySelector('.ytp-right-controls'); // Chọn thanh điều khiển bên phải
        if (ytRightControls) {
            ytRightControls.parentNode.insertBefore(controls, ytRightControls); // Đặt bên trái của thanh điều khiển bên phải
        }

        function syncWithYouTubeControls() {
            const ytBottomControls = document.querySelector('.ytp-chrome-bottom');
            if (ytBottomControls) {
                const isVisible = window.getComputedStyle(ytBottomControls).opacity !== '0';
                controls.style.display = isVisible ? 'flex' : 'none';
            }
        }

        const observer = new MutationObserver(syncWithYouTubeControls);
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    }

    new MutationObserver(() => addControls()).observe(document.body, { childList: true, subtree: true });
})();
