import { useState } from 'react';

export const useFinancialData = () => {
  // 상태 관리
  const [corpName, setCorpName] = useState(''); // 회사 이름
  const [yearRange, setYearRange] = useState(''); // 사업 연도
  const [subject, setSubject] = useState(''); // 계정 과목
  const [report, setReport] = useState(''); // 보고서 유형
  const [fsDiv, setFsDiv] = useState(''); // 재무제표 종류
  const [allAccountData, setAllAccountData] = useState([]); // 계정 데이터 저장
  const [error, setError] = useState(null); // 에러 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [dataFetched, setDataFetched] = useState(false); // 데이터가 fetch되었는지 여부
  const [corpSuggestions, setCorpSuggestions] = useState([]); // 회사 이름 자동 완성 제안 리스트
  const [chartType, setChartType] = useState(''); // 차트 유형
  const [chartReady, setChartReady] = useState(false); // 차트 준비 상태
  const [submittedSubject, setSubmittedSubject] = useState(''); // 제출된 계정 과목

  // ✅ [변경] fetchAllAccountData 함수 수정: 다중 기업 처리
  const fetchAllAccountData = async (subjectOverride = null) => {
    const usedSubject = subjectOverride || subject;

    setLoading(true);
    setError(null);
    setDataFetched(false);
    setAllAccountData([]); // ✅ 새 검색 시 기존 결과 초기화

    // 연도 범위 계산
    const years = [];
    if (yearRange.includes('~')) {
      const [startYear, endYear] = yearRange.split('~').map(y => y.trim());
      for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
        years.push(year.toString());
      }
    } else {
      years.push(...yearRange.split(',').map(y => y.trim()).filter(Boolean));
    }

    // ✅ [변경] 회사명을 컴마로 분리하여 각각 fetch
    const corpList = corpName
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    try {
      const fetchPromises = corpList.map(async (singleCorp) => {
        const query = `corp_name=${singleCorp}&year=${years.join(',')}&reprt_code=${report}&subject=${usedSubject}&fs_div=${fsDiv}`;
        const response = await fetch(`http://localhost:8000/open-dart/get-all-account-data/?${query}`);
        
        if (!response.ok) throw new Error('데이터 조회 오류');

        const data = await response.json();
        console.log(`Fetched data for ${singleCorp}: `, data);

        if (data.length === 0) {
          alert(`${singleCorp}에 대한 데이터가 없습니다.`);
          return null;
        }

        return {
          corp_name: singleCorp,
          data: data,
          subject: usedSubject,
        };
      });

      // ✅ 모든 기업 데이터 병렬 fetch 후 저장
      const results = await Promise.all(fetchPromises);
      const validResults = results.filter(r => r !== null);
      setAllAccountData(validResults);

      if (validResults.length > 0) setChartReady(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setDataFetched(true);
    }
  };

  // 자동 완성 기업명 필터링
  const fetchCorpSuggestions = async (inputValue) => {
    const corpData = await fetchCorpCodeData();
    const suggestions = corpData.filter(item =>
      item.corp_name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const sortedSuggestions = suggestions.sort((a, b) =>
      a.corp_name.localeCompare(b.corp_name)
    );

    console.log("Filtered and Sorted Suggestions:", sortedSuggestions);
    setCorpSuggestions(sortedSuggestions);
  };

  // CORPCODE.XML 파일을 가져오는 함수
  const fetchCorpCodeData = async () => {
    try {
      const response = await fetch('/CORPCODE/CORPCODE.xml');

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log("XML Data:", xmlText);

      const json = xmlToJson(xmlText);
      console.log("Converted JSON:", json);

      return json;
    } catch (error) {
      console.error("Error fetching corp code data:", error);
      return [];
    }
  };

  // XML을 JSON으로 변환하는 함수
  const xmlToJson = (xml) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'application/xml');
    const items = xmlDoc.getElementsByTagName('list');

    const result = [];
    for (let i = 0; i < items.length; i++) {
      result.push({
        corp_code: items[i].getElementsByTagName('corp_code')[0]?.textContent,
        corp_name: items[i].getElementsByTagName('corp_name')[0]?.textContent,
      });
    }

    return result;
  };

  return {
    corpName,
    setCorpName,
    yearRange,
    setYearRange,
    subject,
    setSubject,
    report,
    setReport,
    fsDiv,
    setFsDiv,
    allAccountData,
    setAllAccountData,
    error,
    setError,
    loading,
    setLoading,
    dataFetched,
    setDataFetched,
    chartType,
    setChartType,
    chartReady,
    setChartReady,
    submittedSubject,
    setSubmittedSubject,
    fetchAllAccountData,
    fetchCorpCodeData,
    corpSuggestions,
    setCorpSuggestions,
    fetchCorpSuggestions,
  };
};
