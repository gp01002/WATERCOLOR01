document.addEventListener("DOMContentLoaded", async () => {
    const video = document.getElementById("video");
    const canvas = document.getElementById("overlay");
    const ctx = canvas.getContext("2d");
    const startStopButton = document.getElementById("start-stop");
    const resultDiv = document.getElementById("result");
    let isRecording = false;
    const clickCounts = {};
    const grid = [
        { key: "A", color: "#FF0000", x: 0, y: 0, width: 80, height: 80 },
        { key: "B", color: "#00FF00", x: 80, y: 0, width: 80, height: 80 },
        { key: "C", color: "#0000FF", x: 160, y: 0, width: 80, height: 80 },
        { key: "D", color: "#FFFF00", x: 240, y: 0, width: 80, height: 80 },
        { key: "E", color: "#FF00FF", x: 320, y: 0, width: 80, height: 80 },
        { key: "F", color: "#00FFFF", x: 400, y: 0, width: 80, height: 80 },
        { key: "G", color: "#FFA500", x: 480, y: 0, width: 80, height: 80 },
        { key: "H", color: "#800080", x: 560, y: 0, width: 80, height: 80 }
    ];

    // 初始化点击计数
    grid.forEach(item => {
        clickCounts[item.key] = 0;
    });

    // 访问相机
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await video.play();
    }

    // 加载手部检测模型
    const model = await handpose.load();

    // 开始/停止记录
    startStopButton.addEventListener("click", () => {
        isRecording = !isRecording;
        if (isRecording) {
            startStopButton.textContent = "中止";
            detectHands();
        } else {
            startStopButton.textContent = "记录";
            resultDiv.style.display = "block";
            displayResults();
        }
    });

    async function detectHands() {
        while (isRecording) {
            const predictions = await model.estimateHands(video);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 画出颜色框框
            grid.forEach(item => {
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 4;
                ctx.strokeRect(item.x, item.y, item.width, item.height);
            });

            if (predictions.length > 0) {
                const hand = predictions[0];
                const [x, y] = hand.landmarks[8]; // 获取食指指尖坐标

                // 检查指尖位置是否在某个颜色格子上方
                grid.forEach(item => {
                    if (x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height) {
                        clickCounts[item.key]++;
                    }
                });

                // 在画布上绘制手指位置
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
            await tf.nextFrame();
        }
    }

    function displayResults() {
        const chartCtx = document.getElementById("myChart").getContext("2d");
        new Chart(chartCtx, {
            type: "pie",
            data: {
                labels: Object.keys(clickCounts),
                datasets: [{
                    label: "点击次数",
                    data: Object.values(clickCounts),
                    backgroundColor: grid.map(item => item.color),
                    borderColor: "#FFFFFF",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
});