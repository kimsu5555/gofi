import React, { useRef, useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useFinancialData } from './Search/useFinancialData.js';
import './Compare.css';
import ChartComponent from './Search/ChartComponent.js'; // ChartComponent default import

// 각 출력 결과를 렌더링하는 React 함수 컴포넌트
function OutputRenderer({ companyData, compareMode, onDelete, index, allAccountData }) {
  const [localChartType, setLocalChartType] = useState('');
  const localChartRef = useRef(null);
  const { calculateLinearRegression, copyTableToClipboard, copyChartToClipboard } = ChartComponent();

  const subjectLabelMap = {
    '_OperatingIncomeLoss': '영업이익',
    '_ProfitLoss': '당기순이익(포괄손익계산서)',
    '_Revenue': '매출액',
    '_Inventories': '재고자산',
  };

  const getSubjectLabel = (subject) => {
    return subjectLabelMap[subject] || subject;
  };

const renderChart = () => {
  const pastelColorPalette = [
    'hsl(0, 50%, 70%)',
    'hsl(240, 50%, 70%)',
    'hsl(120, 50%, 70%)',
    'hsl(60, 50%, 70%)',
  ];

  const getSaturationValues = (length) => {
    const maxSaturation = 70;
    const minSaturation = 30;
    const step = length > 1 ? (maxSaturation - minSaturation) / (length - 1) : 0;
    return Array.from({ length }, (_, i) =>
      Math.max(minSaturation, maxSaturation - step * i)
    );
  };

  const chartData = {
    labels: companyData.data.map(item => item.bsns_year),
    datasets: compareMode
      ? allAccountData.map((company, idx) => {
          const colorIndex = idx % pastelColorPalette.length;
          const baseHsl = pastelColorPalette[colorIndex];
          const hue = baseHsl.match(/hsl\((\d+),/)[1];

          return {
            label: company.corp_name,
            data: company.data.map(item => parseInt(item.thstrm_amount) / 100000000),
            backgroundColor: `hsl(${hue}, 50%, 70%)`,
            borderColor: `hsl(${hue}, 50%, 50%)`,
            borderWidth: 1,
          };
        })
      : [{
          label: getSubjectLabel(companyData.subject),
          data: companyData.data.map(item => parseInt(item.thstrm_amount) / 100000000),
          backgroundColor: companyData.data.map((_, idx) => `hsl(200, 70%, ${60 - (idx * 5)}%)`),
          borderColor: companyData.data.map((_, idx) => `hsl(200, 70%, ${40 - (idx * 5)}%)`),
          borderWidth: 1,
        }],
  };

  const commonOptions = {
    scales: {
      y: {
        title: {
          display: true,
          text: '단위: 일억원',
        },
        ticks: {
          callback: (value) => value.toLocaleString(),
        },
      },
    },
  };

  if ((localChartType === '선' || localChartType === '막대') && !compareMode) {
    const trendlineData = calculateLinearRegression(companyData.data.map(item => ({
      x: parseInt(item.bsns_year),
      y: parseInt(item.thstrm_amount),
    }))).map(item => item.y);

    chartData.datasets.push({
      label: '추세선',
      data: trendlineData,
      type: 'line',
      borderColor: 'red',
      fill: false,
      tension: 0.1,
    });
  }

  const copyElementToClipboard = (elementId, isPie = false) => {
    const el = document.getElementById(elementId);

    if (!el) {
      alert('복사할 요소를 찾을 수 없습니다.');
      return;
    }

    // 🎯 원형차트는 canvas 방식으로 복사
    if (isPie) {
      const canvas = el.querySelector('canvas');
      if (!canvas) {
        alert('캔버스를 찾을 수 없습니다.');
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('복사할 수 없습니다.');
          return;
        }
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          alert('차트 이미지가 복사되었습니다!');
        }).catch(() => {
          alert('복사에 실패했습니다.');
        });
      });
      return;
    }

    // ✅ 일반 텍스트/DOM 복사
    const range = document.createRange();
    range.selectNode(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      document.execCommand('copy');
      alert('복사되었습니다!');
    } catch (err) {
      alert('복사 실패');
    }
    selection.removeAllRanges();
  };

  switch (localChartType) {
    case '막대':
      return <Bar ref={localChartRef} data={chartData} options={commonOptions} />;

    case '선':
      return <Line ref={localChartRef} data={chartData} options={commonOptions} />;

    case '원형':
      return compareMode ? (
        <div className="pie-chart-container">
          {allAccountData.map((company, idx) => {
            const colorIndex = idx % pastelColorPalette.length;
            const baseHsl = pastelColorPalette[colorIndex];
            const hue = baseHsl.match(/hsl\((\d+),/)[1];
            const saturations = getSaturationValues(company.data.length);

            const pieData = {
              labels: company.data.map(item => item.bsns_year),
              datasets: [{
                data: company.data.map(item => parseInt(item.thstrm_amount) / 100000000),
                backgroundColor: saturations.map(sat => `hsl(${hue}, ${sat}%, 70%)`),
              }],
            };

            const elementId = `pie-chart-${idx}`;

            return (
              <div key={idx} className="pie-chart-item" style={{ textAlign: 'center', marginBottom: '1em' }}>
                <h3>{company.corp_name}</h3>
                <div id={elementId}>
                  <Pie
                    data={pieData}
                    options={{
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: (tooltipItem) =>
                              `${tooltipItem.label} (${tooltipItem.raw.toLocaleString()} 일억원)`,
                          },
                        },
                      },
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center', marginTop: '0.5em' }}>
                  <button onClick={() => copyElementToClipboard(elementId, true)}>복사</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Pie
          ref={localChartRef}
          data={chartData}
          options={{
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) =>
                    `${tooltipItem.label} (${tooltipItem.raw.toLocaleString()} 일억원)`,
                },
              },
            },
          }}
        />
      );

    default:
      return compareMode ? (
        <div className="compare-output">
          {allAccountData.map((company, idx) => {
            const elementId = `table-${idx}`;
            return (
              <div key={idx} className="table-item">
                <h3>{company.corp_name}</h3>
                <table id={elementId}>
                  <thead>
                    <tr>
                      <th>사업연도</th>
                      <th>{getSubjectLabel(company.subject)} (단위: 일억원)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.data.map((item, i) => (
                      <tr key={i}>
                        <td>{item.bsns_year}</td>
                        <td>{(parseInt(item.thstrm_amount) / 100000000).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', marginTop: '0.5em' }}>
                  <button onClick={() => copyElementToClipboard(elementId)}>복사</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>사업연도</th>
              <th>{getSubjectLabel(companyData.subject)} (단위: 일억원)</th>
            </tr>
          </thead>
          <tbody>
            {companyData.data.map((item, idx) => (
              <tr key={idx}>
                <td>{item.bsns_year}</td>
                <td>{(parseInt(item.thstrm_amount) / 100000000).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
};

return (
  <div className={`output-container ${compareMode ? 'compare-mode' : ''}`}>
    <div className="output-header">
      <button className="delete-button" onClick={onDelete}>×</button>
    </div>

    <div className={`output-results ${compareMode ? 'compare-results' : ''}`}>
      {/* 비교 모드 아닐 때만 회사명 출력 */}
      {!compareMode && (
        <>
          <h2>출력 결과:</h2>
          <p style={{ color: 'black', fontSize: '1.2em' }}>{companyData.corp_name}</p>
        </>
      )}

      {/* 차트 또는 표 렌더링 */}
      {renderChart()}

      {/* 차트 타입 선택 라디오 버튼 */}
      <div className="chart-type-options">
        {['', '막대', '선', '원형'].map((type) => (
          <label key={type} className="radio-label">
            <input
              type="radio"
              name={`chartType-${index}`}
              value={type}
              checked={localChartType === type}
              onClick={(e) => setLocalChartType(e.target.value)}
            />
            {type === '' ? '표' : type}
          </label>
        ))}
      </div>

      {/* 복사 버튼 조건 분기 */}
      {(() => {
        if (!compareMode) {
          // 일반 모드일 때
          return localChartType === '' ? (
            <button onClick={copyTableToClipboard}>표 복사</button>
          ) : (
            <button onClick={() => copyChartToClipboard(localChartRef)}>차트 이미지 복사</button>
          );
        }

        if (compareMode && (localChartType === '막대' || localChartType === '선')) {
          // 비교 모드면서 막대/선 그래프일 때만 공통 복사 버튼 출력
          return (
            <button onClick={() => copyChartToClipboard(localChartRef)}>차트 이미지 복사</button>
          );
        }

        // 비교 모드 + 표 또는 원형 차트일 때는 renderChart() 내부에서 버튼 처리됨
        return null;
      })()}
    </div>
  </div>
);
}

function FinancialDataForm() {
  const {
    corpName, setCorpName,
    yearRange, setYearRange,
    subject, setSubject,
    report, setReport,
    fsDiv, setFsDiv,
    allAccountData, setAllAccountData,
    error, loading, dataFetched,
    fetchAllAccountData,
    corpSuggestions, setCorpSuggestions, fetchCorpSuggestions
  } = useFinancialData();

  const searchSectionRef = useRef(null);
  useEffect(() => {
    searchSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSearchClick = () => {
    if (corpName.length >= 2) {
      fetchCorpSuggestions(corpName);
    } else {
      setCorpSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAllAccountData(subject);
  };

  const [compareMode, setCompareMode] = useState(false); // 비교 모드 상태
  const handleCompareModeChange = (e) => {
    setCompareMode(e.target.checked); // 비교 모드 활성화 여부
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'corpName':
        setCorpName(value);
        break;
      case 'yearRange':
        setYearRange(value);
        break;
      case 'subject':
        setSubject(value);
        break;
      case 'report':
        setReport(value);
        break;
      case 'fsDiv':
        setFsDiv(value);
        break;
      default:
        break;
    }
  };

  const handleDeleteResult = (index) => {
    const newData = [...allAccountData];
    newData.splice(index, 1);
    setAllAccountData(newData);
  };

  const handleCorpSelect = (e) => {
    setCorpName(e.target.value);
    setCorpSuggestions([]);
  };

  return (
    <>
      {/* 입력 폼 영역 */}
      <div className="container">
        <h1>원하는 재무정보를 검색해보세요!</h1>
        <section ref={searchSectionRef}></section>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div>
            <input
              type="text"
              name="corpName"
              placeholder="회사이름 입력 (컴마 ',' 로 여러기업 검색가능)"
              value={corpName}
              onChange={handleInputChange}
              autoComplete="off"
            />
            <button type="button" onClick={handleSearchClick} className="buttonofName">
              회사이름찾기! (예:삼성)
            </button>

            {corpSuggestions.length > 0 && (
              <select
                name="corpName"
                value={corpName}
                onChange={handleCorpSelect}
                size={5}
                style={{ width: '100%', height: 'auto' }}
              >
                {corpSuggestions.map((corp) => (
                  <option key={corp.corp_code} value={corp.corp_name}>
                    {corp.corp_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <input
            type="text"
            name="yearRange"
            placeholder="사업연도 입력 (예: 2021,2022 또는 2021~2022)"
            value={yearRange}
            onChange={handleInputChange}
            autoComplete="off"
            required
          />
          <div className="selection-group">
            <label htmlFor="subject">계정과목:</label>
            <select
              id="subject"
              name="subject"
              value={subject}
              onChange={handleInputChange}
              required
              className="dropdown"
            >
              <option value="" disabled>선택하세요!</option>
              <option value="_ProfitLoss">당기순이익(포괄손익계산서)</option>
              <option value="_OperatingIncomeLoss">영업이익</option>
              <option value="_Revenue">매출액</option>
              <option value="_Inventories">재고자산</option>
            </select>
          </div>

          <div className="selection-group">
            <label htmlFor="report">보고서유형:</label>
            <select
              id="report"
              name="report"
              value={report}
              onChange={handleInputChange}
              required
              className="dropdown"
            >
              <option value="" disabled>선택하세요!</option>
              <option value="11011">사업보고서</option>
              <option value="11012">반기보고서</option>
              <option value="11013">1분기보고서</option>
              <option value="11014">3분기보고서</option>
            </select>
          </div>

          <div className="selection-group">
            <label htmlFor="fsDiv">재무제표종류:</label>
            <select
              id="fsDiv"
              name="fsDiv"
              value={fsDiv}
              onChange={handleInputChange}
              required
              className="dropdown"
            >
              <option value="" disabled>선택하세요!</option>
              <option value="OFS">단일재무제표</option>
              <option value="CFS">연결재무제표</option>
            </select>
          </div>
          <button type="submit">데이터 조회</button>
        </form>

        {/* 비교 모드 체크박스 */}
        <div className="compare-checkbox-container">
          <label>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={handleCompareModeChange}
            />
            기업 한번에 비교하기! (2~4개 기업)
          </label>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">데이터 출력 중입니다...</div>
        </div>
      )}

      {/* 출력 결과 영역 */}
      <div className="form-output-container">
        {!loading && dataFetched && allAccountData.length > 0 && (
          compareMode ? (
            // ✅ 비교 모드일 때: 중앙 정렬된 단일 컨테이너
            <div className="compare-mode-container">
              <OutputRenderer
                key={0}
                companyData={allAccountData[0]} // 첫 기업 기준으로 비교
                index={0}
                onDelete={() => handleDeleteResult(0)} // 필요시 비활성화 가능
                compareMode={true}
                allAccountData={allAccountData}
              />
            </div>
          ) : (
            // ✅ 일반 모드일 때: 기존처럼 2개씩 묶어서 출력
            <>
              {Array.from({ length: Math.ceil(allAccountData.length / 2) }, (_, rowIndex) => {
                const rowItems = allAccountData.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <div key={rowIndex} className="output-row">
                    {rowItems.map((company, index) => {
                      const globalIndex = rowIndex * 2 + index;
                      return (
                        <OutputRenderer
                          key={globalIndex}
                          companyData={company}
                          index={globalIndex}
                          onDelete={() => handleDeleteResult(globalIndex)}
                          compareMode={false}
                          allAccountData={allAccountData}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </>
          )
        )}
        {!loading && dataFetched && allAccountData.length === 0 && !error && (
          <div className="output-container" style={{ width: '100%' }}>
            <p>조회된 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default FinancialDataForm;