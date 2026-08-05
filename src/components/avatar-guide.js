/**
 * Upgraded Avatar Guide Component - Father Domingos (Jesuit Master Architect)
 * Features a detailed holographic character standee, dynamic speech bubble overhead,
 * spatial audio, and state machine with interactive dialogue.
 */
AFRAME.registerComponent('avatar-guide', {
    schema: {
        persona: { type: 'string', default: 'Father Domingos (17th-c. Architect)' }
    },

    init: function () {
        this.state = 'idle'; // idle, attentive, listening, thinking, speaking
        this.gazeTimer = 0;
        this.gazeThreshold = 1000;

        // Clear existing children if any
        while (this.el.firstChild) {
            this.el.removeChild(this.el.firstChild);
        }

        // 1. Pedestal Base with glowing ring
        const pedestal = document.createElement('a-cylinder');
        pedestal.setAttribute('position', '0 0.05 0');
        pedestal.setAttribute('radius', '0.45');
        pedestal.setAttribute('height', '0.1');
        pedestal.setAttribute('color', '#1a1a2e');
        pedestal.setAttribute('material', 'metalness: 0.8; roughness: 0.2');
        this.el.appendChild(pedestal);

        const glowRing = document.createElement('a-ring');
        glowRing.setAttribute('position', '0 0.11 0');
        glowRing.setAttribute('rotation', '-90 0 0');
        glowRing.setAttribute('radius-inner', '0.4');
        glowRing.setAttribute('radius-outer', '0.44');
        glowRing.setAttribute('color', '#00e5ff');
        glowRing.setAttribute('material', 'emissive: #00e5ff; emissiveIntensity: 0.8');
        this.glowRing = glowRing;
        this.el.appendChild(glowRing);

        // 2. Holographic Guide Character Portrait Board
        const portraitPlane = document.createElement('a-plane');
        portraitPlane.setAttribute('position', '0 1.15 0');
        portraitPlane.setAttribute('width', '0.75');
        portraitPlane.setAttribute('height', '1.9');
        portraitPlane.setAttribute('src', './assets/images/guide_portrait.jpg');
        portraitPlane.setAttribute('material', 'transparent: true; alphaTest: 0.1; side: double');
        portraitPlane.setAttribute('shadow', 'cast: true');
        this.portraitPlane = portraitPlane;
        this.el.appendChild(portraitPlane);

        // 3. Floating Name & Role Badge
        const nameBadge = document.createElement('a-plane');
        nameBadge.setAttribute('position', '0 0.25 0.05');
        nameBadge.setAttribute('width', '0.8');
        nameBadge.setAttribute('height', '0.22');
        nameBadge.setAttribute('color', '#0f172a');
        nameBadge.setAttribute('material', 'opacity: 0.85; transparent: true');
        
        const nameText = document.createElement('a-text');
        nameText.setAttribute('value', 'Father Domingos\nArchitect of Bom Jesus');
        nameText.setAttribute('align', 'center');
        nameText.setAttribute('position', '0 0 0.01');
        nameText.setAttribute('scale', '0.28 0.28 0.28');
        nameText.setAttribute('color', '#38bdf8');
        nameBadge.appendChild(nameText);
        this.el.appendChild(nameBadge);

        // 4. Overhead Speech Bubble UI
        this.speechBubble = document.createElement('a-entity');
        this.speechBubble.setAttribute('position', '0 2.2 0');
        this.speechBubble.setAttribute('visible', 'false');

        const bubbleBg = document.createElement('a-plane');
        bubbleBg.setAttribute('width', '1.6');
        bubbleBg.setAttribute('height', '0.6');
        bubbleBg.setAttribute('color', '#020617');
        bubbleBg.setAttribute('material', 'opacity: 0.9; transparent: true; cornerRadius: 10');
        this.speechBubble.appendChild(bubbleBg);

        const bubbleBorder = document.createElement('a-plane');
        bubbleBorder.setAttribute('position', '0 0 -0.005');
        bubbleBorder.setAttribute('width', '1.64');
        bubbleBorder.setAttribute('height', '0.64');
        bubbleBorder.setAttribute('color', '#38bdf8');
        this.speechBubble.appendChild(bubbleBorder);

        this.speechText = document.createElement('a-text');
        this.speechText.setAttribute('value', 'Greetings traveler! Ask me about the construction of this sacred Basilica in Old Goa.');
        this.speechText.setAttribute('align', 'center');
        this.speechText.setAttribute('wrap-count', '30');
        this.speechText.setAttribute('position', '0 0 0.02');
        this.speechText.setAttribute('scale', '0.3 0.3 0.3');
        this.speechText.setAttribute('color', '#f8fafc');
        this.speechBubble.appendChild(this.speechText);

        this.el.appendChild(this.speechBubble);

        // Make guide clickable for voice interaction on desktop/mobile
        portraitPlane.classList.add('clickable');
        portraitPlane.addEventListener('click', () => {
            this.triggerSpeechQuery("Tell me about the Basilica of Bom Jesus and its architecture.");
        });

        // Set spatial audio attributes
        this.el.setAttribute('sound', {
            positional: true,
            refDistance: 1.5,
            rolloffFactor: 1.5
        });

        // Listen to events
        this.el.sceneEl.addEventListener('action-talk-start', () => this.setState('listening'));
        this.el.sceneEl.addEventListener('action-talk-end', () => {
            this.setState('thinking');
            setTimeout(() => {
                this.triggerSpeechQuery("What historical secrets lie within these walls?");
            }, 800);
        });
        
        this.el.sceneEl.addEventListener('speech-transcribed', (evt) => {
            if (evt.detail && evt.detail.transcript) {
                this.triggerSpeechQuery(evt.detail.transcript);
            }
        });
    },

    triggerSpeechQuery: function(userQuery) {
        this.setState('thinking');
        this.showSpeech("Thinking about your query...", '#f59e0b');

        // Synthesize response (simulated or LLM)
        setTimeout(() => {
            let answer = "";
            if (userQuery.toLowerCase().includes("tomb") || userQuery.toLowerCase().includes("xavier")) {
                answer = "Inside lies the silver mausoleum of St. Francis Xavier, crafted by Florentine artist Foggini in 1698!";
            } else if (userQuery.toLowerCase().includes("laterite") || userQuery.toLowerCase().includes("stone")) {
                answer = "The red laterite stone was locally quarried in Goa. The plaster was removed in the 20th century, exposing this distinctive facade.";
            } else {
                answer = "Welcome to the Basilica of Bom Jesus, founded in 1594! I oversaw the masonry during Goa's golden age.";
            }

            this.setState('speaking');
            this.showSpeech(answer, '#38bdf8');
            this.speakVoice(answer);
        }, 1200);
    },

    showSpeech: function(text, textColor = '#f8fafc') {
        this.speechBubble.setAttribute('visible', 'true');
        this.speechText.setAttribute('value', text);
        this.speechText.setAttribute('color', textColor);
    },

    speakVoice: function(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 0.9;
            utterance.onend = () => {
                this.setState('idle');
                setTimeout(() => {
                    this.speechBubble.setAttribute('visible', 'false');
                }, 4000);
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => this.setState('idle'), 4000);
        }
    },

    setState: function (newState) {
        this.state = newState;

        switch (newState) {
            case 'idle':
                this.glowRing.setAttribute('color', '#38bdf8');
                this.glowRing.setAttribute('material', 'emissive: #38bdf8; emissiveIntensity: 0.5');
                break;
            case 'attentive':
                this.glowRing.setAttribute('color', '#34d399');
                this.glowRing.setAttribute('material', 'emissive: #34d399; emissiveIntensity: 0.9');
                break;
            case 'listening':
                this.glowRing.setAttribute('color', '#f43f5e');
                this.glowRing.setAttribute('material', 'emissive: #f43f5e; emissiveIntensity: 1.0');
                break;
            case 'thinking':
                this.glowRing.setAttribute('color', '#fbbf24');
                this.glowRing.setAttribute('material', 'emissive: #fbbf24; emissiveIntensity: 1.0');
                break;
            case 'speaking':
                this.glowRing.setAttribute('color', '#22c55e');
                this.glowRing.setAttribute('material', 'emissive: #22c55e; emissiveIntensity: 1.2');
                break;
        }
    },

    tick: function (time, timeDelta) {
        // Billboard speech bubble towards active camera
        if (this.speechBubble.getAttribute('visible')) {
            const camera = this.el.sceneEl.camera;
            if (camera) {
                const camPos = new THREE.Vector3();
                camera.getWorldPosition(camPos);
                this.speechBubble.object3D.lookAt(camPos);
            }
        }

        // Pulse glow effect when speaking
        if (this.state === 'speaking') {
            const pulse = 0.8 + Math.sin(time * 0.008) * 0.4;
            this.glowRing.setAttribute('material', `emissiveIntensity: ${pulse}`);
        }
    }
});
