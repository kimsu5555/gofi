import React, { useRef, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { ChartComponent } from './Search/ChartComponent.js'; // ChartComponent가 default export로 되어 있으면 import 방식을 수정해야 합니다
import { useFinancialData } from './Search/useFinancialData.js';
import './Compare.css';

function FinancialDataForm() {
  const { // useFinancialData.js 에서 상태변수 가져오기
    corpName,setCorpName,           
    yearRange,setYearRange,          
    subject,setSubject,           
    report,setReport,             
    fsDiv,setFsDiv,              
    allAccountData,setAllAccountData,
    error,loading,dataFetched,
    chartType,setChartType,chartReady,
    submittedSubject,setSubmittedSubject,
    fetchAllAccountData,
    corpSuggestions,setCorpSuggestions,fetchCorpSuggestions
  } = useFinancialData();
  const {
    calculateLinearRegression,copyTableToClipboard,copyChartToClipboard
  } = ChartComponent();

  const searchSectionRef = useRef(null); // 스크롤을 위한 ref
  useEffect(() => {
    // 컴포넌트가 마운트되면 특정 섹션으로 스크롤
    searchSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSearchClick = () => {
    if (corpName.length >= 2) {
      fetchCorpSuggestions(corpName);  // 기업명 검색 시작
    } else {
      setCorpSuggestions([]);         // 2글자 미만일 때 자동완성 목록 초기화
    }
  };

  
  // 폼 제출 핸들러
    const handleSubmit = (e) => {
      e.preventDefault();
      setSubmittedSubject(subject);        
      fetchAllAccountData(subject);          
    };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 각 입력 필드별로 상태를 업데이트
    switch (name) {
      case 'corpName':
        setCorpName(value); // 자동완성은 버튼 클릭으로만 처리
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
    newData.splice(index, 1); // index 번째 요소 삭제
    setAllAccountData(newData);
  };
  useEffect(() => {
    // corpSuggestions 상태가 변경되었을 때 콘솔에 출력
    console.log("자동완성 제안 리스트:", corpSuggestions);
  }, [corpSuggestions]); // 상태가 변경될 때마다 콘솔에 출력

  const handleCorpSelect = (e) => {
    setCorpName(e.target.value);  // 선택한 기업명을 입력 필드에 반영
    setCorpSuggestions([]);       // 드롭다운 목록을 비워서 숨김
  };
  
  const chartRef = useRef(null); // 차트를 참조하기 위한 ref
  const subjectLabelMap = {
    '_OperatingIncomeLoss': '영업이익',
    '_ProfitLoss': '당기순이익(포괄손익계산서)',
    '_Revenue': '매출액',
    '_Inventories': '재고자산'
  };
  
  const getSubjectLabel = (subject) => {
    return subjectLabelMap[subject] || subject;
  };

  // 차트 렌더링 함수
  const renderChart = (companyData) => {
    const chartData = {
        labels: companyData.map(item => item.bsns_year),
        datasets: [
          {
            label: getSubjectLabel(submittedSubject),  // 여기서 subject를 변환하여 출력
            data: companyData.map(item => parseInt(item.thstrm_amount) / 100000000),
            backgroundColor: chartType === '원형'
              ? companyData.map((_, index) => `hsl(200, 70%, ${60 - (index * 5)}%)`)
              : 'rgba(75, 192, 192, 0.6)',
            borderColor: chartType === '원형'
              ? companyData.map((_, index) => `hsl(200, 70%, ${40 - (index * 5)}%)`)
              : 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          ...(chartType !== '원형' ? [{
            label: '추세선',
            data: calculateLinearRegression(companyData.map(item => ({
              x: parseInt(item.bsns_year),
              y: parseInt(item.thstrm_amount),
            }))).map(item => item.y),
            type: 'line',
            borderColor: 'red',
            fill: false,
            tension: 0.1,
          }] : []),
        ],
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
    
  
    switch (chartType) {
      case '막대':
        return <Bar ref={chartRef} data={chartData} options={commonOptions} />;
      case '선':
        return <Line ref={chartRef} data={chartData} options={commonOptions} />;
      case '원형':
        return <Pie
          ref={chartRef}
          data={chartData}
          options={{
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => `${tooltipItem.label} (${(tooltipItem.raw).toLocaleString()} 일억원)`,
                },
              },
            },
          }}
        />;
      default:
        return (
          <table>
            <thead>
              <tr>
                <th>사업연도</th>
                <th>{getSubjectLabel(submittedSubject)} (단위: 일억원)</th>
              </tr>
            </thead>
            <tbody>
              {companyData.map((item, index) => (
                <tr key={index}>
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
              placeholder="회사이름 입력"
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
              <option value="Inventories">재고자산</option>
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
      </div>
  
      {/* 오버레이 로딩 표시 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">데이터 출력 중입니다...</div>
        </div>
      )}
  
      {/* 출력 결과 영역 */}
      <div className="form-output-container">
        {!loading && dataFetched && allAccountData.length > 0 && (
          <>
            {Array.from({ length: Math.ceil(allAccountData.length / 2) }, (_, rowIndex) => {
              const rowItems = allAccountData.slice(rowIndex * 2, rowIndex * 2 + 2);
              return (
                <div key={rowIndex} className="output-row">
                  {rowItems.map((company, index) => {
                    const globalIndex = rowIndex * 2 + index;
                    return (
                      <div key={globalIndex} className="output-container">
                        <div className="output-header">
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteResult(globalIndex)}
                          >
                            ×
                          </button>
                        </div>
  
                        <div className="output-results">
                          <h2>출력 결과:</h2>
                          <p style={{ color: 'black', fontSize: '1.2em' }}>{company.corp_name}</p>
  
                          {chartReady && (
                            <>
                              {renderChart(company.data)}
  
                              <div className="chart-type-options">
                                {['', '막대', '선', '원형'].map((type) => (
                                  <label key={type} className="radio-label">
                                    <input
                                      type="radio"
                                      name={`chartType-${globalIndex}`}
                                      value={type}
                                      checked={chartType === type}
                                      onChange={(e) => setChartType(e.target.value)}
                                    />
                                    {type === '' ? '표' : type}
                                  </label>
                                ))}
                              </div>
  
                              {chartType === '' ? (
                                <button onClick={copyTableToClipboard}>표 복사</button>
                              ) : (
                                <button onClick={() => copyChartToClipboard(chartRef)}>
                                  차트 이미지 복사
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
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


