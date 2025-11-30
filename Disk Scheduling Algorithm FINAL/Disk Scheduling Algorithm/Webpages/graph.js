class DiskGraph {
    constructor() {
        this.staticCanvas = document.getElementById('graphStatic');
        this.canvas = document.getElementById('graphCanvas');
        if (!this.canvas || !this.staticCanvas) return;

        this.staticCtx = this.staticCanvas.getContext('2d');
        this.ctx = this.canvas.getContext('2d');

        this.segmentDuration = 900;
        this.easing = t => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2);
        this.cssWidth = 0; 
        this.cssHeight = 0;
    }

    setSize(width, height) {
       
        this.cssWidth = Math.max(1, Math.floor(width));
        this.cssHeight = Math.max(1, Math.floor(height));

        const ratio = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.floor(this.cssWidth * ratio));
        const h = Math.max(1, Math.floor(this.cssHeight * ratio));

       
        this.staticCanvas.width = w;
        this.staticCanvas.height = h;
        this.staticCanvas.style.width = this.cssWidth + 'px';
        this.staticCanvas.style.height = this.cssHeight + 'px';

        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.width = this.cssWidth + 'px';
        this.canvas.style.height = this.cssHeight + 'px';

        
        this.staticCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    setSizeFromContainer(container) {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        this.setSize(rect.width, rect.height);
    }

    clearDynamic() {
      
        if (this.cssWidth && this.cssHeight) this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    }

    drawStaticBackground() {
        const ctx = this.staticCtx;
        if (!ctx) return;

        const W = this.cssWidth || 300;
        const H = this.cssHeight || 200;

        ctx.fillStyle = 'rgb(15, 35, 75)';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(88, 125, 185, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (W / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 40);
            ctx.lineTo(x, H - 40);
            ctx.stroke();
        }
        for (let i = 0; i <= 5; i++) {
            const y = 40 + ((H - 80) / 5) * i;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(W - 20, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgb(204, 216, 235)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, H - 40);
        ctx.lineTo(W - 20, H - 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(50, 40);
        ctx.lineTo(50, H - 40);
        ctx.stroke();

        ctx.fillStyle = 'rgb(162, 188, 231)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        const ticksLeft = 50;
        const ticksRight = W - 20;
        const timeLabelX = Math.round((ticksLeft + ticksRight) / 2);
        ctx.fillText('Time', timeLabelX, H - 15);

        ctx.save();
        ctx.translate(20, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Position', 0, 0);
        ctx.restore();

        ctx.fillStyle = 'rgb(162, 188, 231)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = H - 40 - ((H - 80) / 5) * i;
            const value = Math.round((199 / 5) * i);
            ctx.fillText(value, 45, y + 4);
        }
        ctx.textAlign = 'center';
        for (let i = 0; i <= 10; i++) {
            const x = 50 + ((W - 70) / 10) * i;
            ctx.fillText(i, x, H - 25);
        }
    }

    getCoords(position, step, maxSteps) {
        const padding = { left: 50, right: 20, top: 40, bottom: 40 };
        const graphWidth = (this.cssWidth || this.staticCanvas.clientWidth) - padding.left - padding.right;
        const graphHeight = (this.cssHeight || this.staticCanvas.clientHeight) - padding.top - padding.bottom;

        const x = padding.left + (step / maxSteps) * graphWidth;
        const y = padding.top + graphHeight - (position / 199) * graphHeight;

        return { x, y };
    }

    drawDotOnDynamic(x, y, color = 'rgb(255, 150, 100)', radius = 4) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawLineOnDynamic(x1, y1, x2, y2, color = 'rgb(100, 200, 255)') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    async animate(sequence) {
        if (!sequence || sequence.length === 0) return;

        const coordsArr = [];
        for (let i = 0; i < sequence.length; i++) coordsArr.push(this.getCoords(sequence[i], i, sequence.length - 1));

        this.clearDynamic();
        this.drawDotOnDynamic(coordsArr[0].x, coordsArr[0].y);

        const animateSegment = (from, to, completedIndex) => {
            return new Promise(resolve => {
                const start = performance.now();
                const loop = (now) => {
                    const elapsed = now - start;
                    const t = Math.min(1, elapsed / this.segmentDuration);
                    const eased = this.easing(t);

                    this.clearDynamic();

                    for (let i = 0; i < completedIndex; i++) {
                        const a = coordsArr[i];
                        const b = coordsArr[i+1];
                        if (b) this.drawLineOnDynamic(a.x, a.y, b.x, b.y);
                        this.drawDotOnDynamic(a.x, a.y);
                    }

                    const cx = from.x + (to.x - from.x) * eased;
                    const cy = from.y + (to.y - from.y) * eased;
                    this.drawLineOnDynamic(from.x, from.y, cx, cy);
                    this.drawDotOnDynamic(cx, cy);

                    if (t < 1) requestAnimationFrame(loop);
                    else resolve();
                };
                requestAnimationFrame(loop);
            });
        };

        for (let i = 1; i < coordsArr.length; i++) {
            const from = coordsArr[i-1];
            const to = coordsArr[i];
            await animateSegment(from, to, i-1);
        }

        this.clearDynamic();
        for (let i = 0; i < coordsArr.length; i++) {
            if (i > 0) {
                const a = coordsArr[i-1];
                const b = coordsArr[i];
                this.drawLineOnDynamic(a.x, a.y, b.x, b.y);
            }
            this.drawDotOnDynamic(coordsArr[i].x, coordsArr[i].y);
        }
    }
}

window.graph = null;

function positionContainer(container, inputField) {
    const rect = inputField.getBoundingClientRect();
    const gap = 20;
    
    const cw = container.offsetWidth || 550;
    const ch = container.offsetHeight || 360;

    
    const availableRight = Math.max(0, window.innerWidth - (rect.right + gap));

    let left;
    if (availableRight >= cw) {
       
        left = Math.round(rect.right + window.scrollX + gap + (availableRight - cw) / 2);
    } else if (rect.left >= cw + gap) {
        
        left = Math.round(rect.left + window.scrollX - gap - cw);
    } else {
        
        left = Math.min(Math.max(8, rect.right + window.scrollX + gap), Math.max(8, window.innerWidth - cw - 8));
    }

    
    const scrollY = window.scrollY || window.pageYOffset || 0;
    let desiredTop = Math.round(rect.top + scrollY + (rect.height - ch) / 2);

    const gapV = 12;
   
    let minTop = 8 + scrollY;
    const header = document.querySelector('header');
    if (header) {
        const hRect = header.getBoundingClientRect();
        minTop = Math.max(minTop, Math.round(hRect.bottom + scrollY + gapV));
    }

    
    let maxTop = Math.round(scrollY + window.innerHeight - ch - 8);
    const expected = document.querySelector('.expected-output');
    if (expected) {
        const eRect = expected.getBoundingClientRect();
        maxTop = Math.min(maxTop, Math.round(eRect.top + scrollY - ch - gapV));
    }
    const nav = document.querySelector('nav');
    if (nav) {
        const nRect = nav.getBoundingClientRect();
        maxTop = Math.min(maxTop, Math.round(nRect.top + scrollY - ch - gapV));
    }

    
    let top = Math.min(Math.max(minTop, desiredTop), maxTop);
   
    if (minTop > maxTop) {
        top = Math.round(scrollY + (window.innerHeight - ch) / 2);
        top = Math.max(scrollY + 8, Math.min(top, scrollY + window.innerHeight - ch - 8));
    }

    // Use fixed positioning so the container placement is stable across pages and during layout changes
    // (media query can override to relative on small viewports)
    container.style.position = 'fixed';
    // left/top were computed using client coordinates (rect + window.scrollX previously),
    // but since we use fixed positioning, supply viewport coordinates directly.
    container.style.left = left + 'px';
    container.style.top = top + 'px';
}

function initGraph() {
    const staticCanvas = document.getElementById('graphStatic');
    const dynCanvas = document.getElementById('graphCanvas');
    const container = document.getElementById('graph-container');
    const inputField = document.querySelector('.input-field');
    
    if (staticCanvas && dynCanvas && container && inputField) {
        
        positionContainer(container, inputField);
        
        
        window.graph = new DiskGraph();
        window.graph.setSizeFromContainer(container);
        window.graph.drawStaticBackground();
        
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                container.style.visibility = 'visible';
                container.style.pointerEvents = 'auto';
            });
        });
    }
}

window.addEventListener('load', initGraph);
window.addEventListener('resize', () => {
    if (document.getElementById('graphCanvas') && document.getElementById('graphStatic')) {
        const staticCanvas = document.getElementById('graphStatic');
        const dynCanvas = document.getElementById('graphCanvas');
        const container = document.getElementById('graph-container');
        const inputField = document.querySelector('.input-field');
        
        if (inputField && container && window.graph) {
            
            positionContainer(container, inputField);
            window.graph.setSizeFromContainer(container);
            window.graph.drawStaticBackground();
            window.graph.clearDynamic();
        }
    }
});
