const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const thicknessInput = document.getElementById('thickness');
const thicknessValue = document.getElementById('thicknessValue');
const toolBtns = document.querySelectorAll('.tool-btn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
let isDrawing = false;
let currentTool = 'brush';
let currentColor = colorPicker.value;
let currentThickness = parseInt(thicknessInput.value);
let startX = 0;
let startY = 0;
let snapshot = null;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
thicknessInput.addEventListener('input', (e) => {
    currentThickness = parseInt(e.target.value);
    thicknessValue.textContent = currentThickness;
});

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        if (currentTool === 'eraser') {
            canvas.style.cursor = 'cell';
        } else if (currentTool === 'brush') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'pointer';
        }
    });
});

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    ctx.lineWidth = currentThickness;
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;

    if (currentTool === 'brush' || currentTool === 'eraser') {
        if (currentTool === 'eraser') {
            ctx.strokeStyle = '#ffffff';
        }
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY); 
        ctx.stroke();
    } else if (currentTool === 'rect' || currentTool === 'circle') {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (currentTool === 'brush' || currentTool === 'eraser') {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === 'rect' || currentTool === 'circle') {
        ctx.putImageData(snapshot, 0, 0);
        
        ctx.beginPath();
        if (currentTool === 'rect') {
            const width = currentX - startX;
            const height = currentY - startY;
            ctx.rect(startX, startY, width, height);
            ctx.stroke();
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
});

window.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath(); 
    }
});

canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
    }
});

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my_drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});