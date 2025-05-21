import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
// Chart.js의 필요한 요소들을 등록
Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export const ChartComponent = () => {
    // 선형회귀 함수
    const calculateLinearRegression = (data) => {
        const n = data.length;
        const sumX = data.reduce((acc, item) => acc + item.x, 0); 
        const sumY = data.reduce((acc, item) => acc + item.y, 0);  
        const sumXY = data.reduce((acc, item) => acc + item.x * item.y, 0);  
        const sumX2 = data.reduce((acc, item) => acc + item.x * item.x, 0);  
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const regressionLine = data.map(item => ({
            x: item.x,
            y: (slope * item.x + intercept) / 100000000,  // 원 단위로 변환
        }));
        return regressionLine;
    };

    // 전체 테이블 복사 함수
    const copyTableToClipboard = () => {
        const table = document.querySelector('table');
        const range = document.createRange();
        range.selectNode(table);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        alert('표가 클립보드에 복사되었습니다!');
    };

    // 차트 이미지를 복사하는 함수
    const copyChartToClipboard = (chartRef) => {
  if (!chartRef?.current) {
    alert('차트를 찾을 수 없습니다.');
    return;
  }

  try {
    let canvas;

    // 1. Chart.js 인스턴스인지 확인
    if (typeof chartRef.current.toBase64Image === 'function') {
      // ✅ Chart.js 인스턴스
      const imageUrl = chartRef.current.toBase64Image();
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        tempCanvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ])
              .then(() => alert('차트 이미지가 클립보드에 복사되었습니다!'))
              .catch((err) => {
                console.error('이미지 복사 실패', err);
                alert('이미지 복사에 실패했습니다.');
              });
          } else {
            alert('이미지를 Blob으로 변환하는 데 실패했습니다.');
          }
        });
      };

      img.onerror = () => {
        alert('이미지를 불러오는 데 실패했습니다.');
      };

    } else {
      // ❌ Chart.js 인스턴스가 아니면, DOM에서 canvas를 직접 탐색
      canvas = chartRef.current.querySelector('canvas');
      if (!canvas) {
        alert('캔버스를 찾을 수 없습니다.');
        return;
      }

      canvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ])
            .then(() => alert('차트 이미지가 클립보드에 복사되었습니다!'))
            .catch((err) => {
              console.error('이미지 복사 실패', err);
              alert('이미지 복사에 실패했습니다.');
            });
        } else {
          alert('이미지를 Blob으로 변환하는 데 실패했습니다.');
        }
      }, 'image/png');
    }

  } catch (error) {
    console.error('복사 처리 중 오류 발생:', error);
    alert('차트 복사 중 오류가 발생했습니다.');
  }
};

    return {
        calculateLinearRegression,
        copyTableToClipboard,
        copyChartToClipboard
    };
};
export default ChartComponent; 