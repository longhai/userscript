// ==UserScript==
// @name         TTS Highlight + Scroll + Speed + Selection + UI
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Đọc từng câu, tô màu từ/câu, giao diện điều chỉnh tốc độ và giọng nói, hỗ trợ chọn văn bản để đọc, có nút tạm dừng và tiếp tục
// @author       Bạn
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // CSS cho highlight
    const style = document.createElement('style');
    style.textContent = `
    .tts-sentence {
        background-color: transparent;
    }
    .tts-highlight-sentence {
        background-color: #b2d6f3;
    }
    .tts-highlight-word {
        background-color: yellow;
        color: black;
    }`;
    document.head.appendChild(style);

    // Tạo biểu tượng loa
    const iconButton = document.createElement('button');
    iconButton.innerText = '🔊';
    Object.assign(iconButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        padding: '10px 10px',
        fontSize: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '20%',
        cursor: 'pointer',
    });

    // Bảng điều khiển
    const controlPanel = document.createElement('div');
    controlPanel.style.position = 'fixed';
    controlPanel.style.bottom = '70px';
    controlPanel.style.right = '20px';
    controlPanel.style.zIndex = '10000';
    controlPanel.style.background = 'white';
    controlPanel.style.border = '1px solid #ccc';
    controlPanel.style.borderRadius = '8px';
    controlPanel.style.padding = '10px';
    controlPanel.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    controlPanel.style.display = 'none';
    controlPanel.innerHTML = `
      <label style="display:block; margin-bottom:8px;">Tốc độ</label>
      <input id="tts-rate" type="range" min="0.5" max="2" step="0.1" value="1" style="width: 100%; margin-bottom: 10px;">
      <label style="display:block; margin-bottom:4px;">Chọn Giọng nói</label>
      <select id="tts-voice" style="width: 100%; padding: 4px;"></select>
      <div style="display: flex; gap: 5px; margin-top: 10px;">
        <button id="tts-start" style="flex: 1; padding:6px; background:#007bff; color:white; border:none; border-radius:4px;">Bắt đầu đọc</button>
        <button id="tts-pause" style="flex: 1; padding:6px; background:#ffc107; color:black; border:none; border-radius:4px;" disabled>Tạm dừng</button>
      </div>
    `;

    document.body.appendChild(iconButton);
    document.body.appendChild(controlPanel);

    let sentenceElements = [];
    let currentSentenceIndex = 0;
    let isReading = false;
    let isPaused = false;
    let currentUtterance = null;
    let pausedOnSentence = 0;

    function getSystemLanguage() {
        return navigator.language || navigator.userLanguage || 'en-US';
    }

    function splitSentences(text) {
        return text.match(/[^.!?…]+[.!?…]?/g) || [];
    }

    function wrapWords(sentenceText) {
        return sentenceText.trim().split(/\s+/)
            .map(word => `<span class="tts-word">${word}</span>`)
            .join(' ');
    }

    function wrapContent() {
        const container = document.querySelector('article, #content, main, body');
        if (!container) return [];

        const paragraphs = Array.from(container.querySelectorAll('p'));
        if (paragraphs.length === 0) return [];

        sentenceElements = [];

        paragraphs.forEach(p => {
            const sentences = splitSentences(p.innerText);
            const html = sentences.map(sentence => {
                const wordHTML = wrapWords(sentence);
                return `<span class="tts-sentence">${wordHTML}</span>`;
            }).join(' ');
            p.innerHTML = html;
        });

        return Array.from(document.querySelectorAll('.tts-sentence'));
    }

    function clearAllHighlight() {
        document.querySelectorAll('.tts-highlight-sentence').forEach(el => el.classList.remove('tts-highlight-sentence'));
        document.querySelectorAll('.tts-highlight-word').forEach(el => el.classList.remove('tts-highlight-word'));
    }

    function highlightWord(offset, length, container) {
        clearWordHighlight(container);
        const textNodes = getTextNodes(container);
        let currentOffset = 0;
        for (const node of textNodes) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength > offset) {
                const wordStart = offset - currentOffset;
                const wordEnd = wordStart + length;

                const word = node.textContent.slice(wordStart, wordEnd);
                const before = node.textContent.slice(0, wordStart);
                const after = node.textContent.slice(wordEnd);

                const span = document.createElement('span');
                span.className = 'tts-highlight-word';
                span.textContent = word;

                const parent = node.parentNode;
                parent.replaceChild(document.createTextNode(after), node);
                parent.insertBefore(span, parent.firstChild.nextSibling);
                parent.insertBefore(document.createTextNode(before), parent.firstChild);

                break;
            }
            currentOffset += nodeLength;
        }
    }

    function clearWordHighlight(container) {
        container.querySelectorAll('.tts-highlight-word').forEach(span => {
            const text = document.createTextNode(span.textContent);
            span.replaceWith(text);
        });
    }

    function getTextNodes(el) {
        const nodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            nodes.push(node);
        }
        return nodes;
    }

    function scrollIntoViewSmoothly(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function speakSentence(index) {
        if (index >= sentenceElements.length) {
            stopReading();
            return;
        }

        const el = sentenceElements[index];
        clearAllHighlight();
        el.classList.add('tts-highlight-sentence');
        scrollIntoViewSmoothly(el);

        const sentenceText = el.innerText;
        const utterance = new SpeechSynthesisUtterance(sentenceText);
        utterance.lang = 'vi-VN';
        utterance.rate = parseFloat(document.getElementById('tts-rate').value);
        utterance.pitch = 1;
        utterance.volume = 1;

        const selectedVoice = document.getElementById('tts-voice').value;
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                highlightWord(event.charIndex, event.charLength || 1, el);
            }
        };

        utterance.onend = () => {
            if (!isPaused) {
                currentSentenceIndex++;
                speakSentence(currentSentenceIndex);
            } else {
                pausedOnSentence = currentSentenceIndex;
            }
        };

        currentUtterance = utterance;
        speechSynthesis.speak(utterance);
    }

    function pauseReading() {
        if (!isReading) return;

        isPaused = true;
        speechSynthesis.pause();
        document.getElementById('tts-pause').innerText = 'Tiếp tục';
        document.getElementById('tts-pause').style.background = '#28a745';
        document.getElementById('tts-start').disabled = true;
    }

    function resumeReading() {
        if (!isReading) return;

        isPaused = false;
        speechSynthesis.resume();
        document.getElementById('tts-pause').innerText = 'Tạm dừng';
        document.getElementById('tts-pause').style.background = '#ffc107';
        document.getElementById('tts-start').disabled = false;

        // Nếu đang ở cuối câu thì đọc câu tiếp theo
        if (!currentUtterance || speechSynthesis.paused) {
            speakSentence(pausedOnSentence);
        }
    }

    function stopReading() {
        speechSynthesis.cancel();
        isReading = false;
        isPaused = false;
        currentSentenceIndex = 0;
        pausedOnSentence = 0;
        sentenceElements = [];
        clearAllHighlight();
        document.getElementById('tts-start').innerText = 'Bắt đầu đọc';
        document.getElementById('tts-pause').innerText = 'Tạm dừng';
        document.getElementById('tts-pause').style.background = '#ffc107';
        document.getElementById('tts-pause').disabled = true;
        document.getElementById('tts-start').disabled = false;
    }

    function loadVoices() {
        const select = document.getElementById('tts-voice');
        select.innerHTML = '';
        const voices = speechSynthesis.getVoices();
        const systemLanguage = getSystemLanguage();

        let defaultVoiceIndex = 0;
        let foundSystemLanguage = false;

        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            select.appendChild(option);

            // Ưu tiên chọn giọng nói cùng ngôn ngữ với hệ thống
            if (voice.lang === systemLanguage) {
                defaultVoiceIndex = index;
                foundSystemLanguage = true;
            }

            // Ưu tiên thêm nếu là giọng nữ cùng ngôn ngữ
            if (voice.lang === systemLanguage && voice.name.toLowerCase().includes('female')) {
                defaultVoiceIndex = index;
            }
        });

        // Nếu không tìm thấy giọng cùng ngôn ngữ, tìm giọng có ngôn ngữ gần giống
        if (!foundSystemLanguage && voices.length > 0) {
            const mainLang = systemLanguage.split('-')[0];
            for (let i = 0; i < voices.length; i++) {
                if (voices[i].lang.startsWith(mainLang)) {
                    defaultVoiceIndex = i;
                    break;
                }
            }
        }

        // Chọn giọng nói phù hợp nếu có
        if (voices.length > 0) {
            select.selectedIndex = defaultVoiceIndex;
        }
    }

    // Sự kiện khi click biểu tượng
    iconButton.addEventListener('click', () => {
        controlPanel.style.display = controlPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Nút bắt đầu đọc
    document.getElementById('tts-start').addEventListener('click', () => {
        if (isReading && !isPaused) {
            stopReading();
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection && selection.toString().trim();

        const rate = parseFloat(document.getElementById('tts-rate').value);
        const voiceName = document.getElementById('tts-voice').value;

        if (selectedText) {
            isReading = true;
            document.getElementById('tts-start').innerText = '⏹️ Dừng đọc';
            document.getElementById('tts-pause').disabled = false;

            const utterance = new SpeechSynthesisUtterance(selectedText);
            utterance.lang = 'vi-VN';
            utterance.rate = rate;

            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === voiceName);
            if (voice) utterance.voice = voice;

            utterance.onend = () => stopReading();
            currentUtterance = utterance;
            speechSynthesis.speak(utterance);
        } else {
            sentenceElements = wrapContent();
            if (sentenceElements.length === 0) {
                alert('Không tìm thấy nội dung để đọc!');
                return;
            }
            isReading = true;
            document.getElementById('tts-start').innerText = '⏹️ Dừng đọc';
            document.getElementById('tts-pause').disabled = false;
            speakSentence(currentSentenceIndex);
        }
    });

    // Nút tạm dừng/tiếp tục
    document.getElementById('tts-pause').addEventListener('click', () => {
        if (isPaused) {
            resumeReading();
        } else {
            pauseReading();
        }
    });

    // Load danh sách giọng nói
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', function() {
            loadVoices();
        });
    } else {
        loadVoices();
    }

    // Thử load lại voices nếu chưa có sau 1 giây
    setTimeout(() => {
        if (document.getElementById('tts-voice').options.length === 0) {
            loadVoices();
        }
    }, 1000);
})();