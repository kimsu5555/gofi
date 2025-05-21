// CorpSearch.js
import React, { useState, useEffect } from 'react';
import './CorpSearch.css';

function CorpSearch({ onSelectCorp }) {
  const [corpList, setCorpList] = useState([]); // 기업명 목록
  const [filteredCorps, setFilteredCorps] = useState([]); // 검색된 기업명 목록
  const [searchTerm, setSearchTerm] = useState(''); // 검색어
  const [error, setError] = useState(null); // 에러 상태

  // XML 파일을 불러와 기업명 목록 생성
  useEffect(() => {
    const fetchCorpData = async () => {
      try {
        const response = await fetch('/CORPCODE.XML'); // XML 파일 경로
        if (response.ok) {
          const text = await response.text(); // XML 데이터를 텍스트로 변환
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const corpNodes = xml.getElementsByTagName('list'); // XML의 <list> 태그 탐색
          const corpData = Array.from(corpNodes).map((node) => ({
            name: node.getElementsByTagName('corp_name')[0].textContent, // 회사명
            code: node.getElementsByTagName('corp_code')[0].textContent, // 회사코드
          }));
          setCorpList(corpData); // 기업명 목록 저장
        } else {
          throw new Error('CORPCODE.XML 파일을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        setError(err.message); // 에러 상태 저장
      }
    };

    fetchCorpData(); // 데이터 불러오기
  }, []);

  // 검색어에 따라 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCorps([]); // 검색어가 없으면 결과 초기화
    } else {
      const filtered = corpList.filter((corp) =>
        corp.name.includes(searchTerm) // 검색어가 포함된 기업명 필터링
      );
      setFilteredCorps(filtered);
    }
  }, [searchTerm, corpList]);

  return (
    <div className="corp-search-container">
      <input
        type="text"
        placeholder="회사명을 입력하세요"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // 검색어 업데이트
        className="corp-search-input"
      />
      {error && <p className="error-text">{error}</p>} {/* 에러 메시지 표시 */}
      {filteredCorps.length > 0 && (
        <ul className="corp-search-results">
          {filteredCorps.map((corp) => (
            <li
              key={corp.code}
              onClick={() => onSelectCorp(corp.name)} // 회사명 선택
              className="corp-result-item"
            >
              {corp.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CorpSearch;
