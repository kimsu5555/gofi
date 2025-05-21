import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';  // React 라우팅 기능을 제공하는 라이브러리
import './App.css';  // 기본 스타일
import './style.css';  // 추가 스타일
import Home from './pages/Home';  // Home 컴포넌트 불러오기
import About from './pages/About';  // About 컴포넌트 불러오기
import Search from './pages/Search';  // Search 컴포넌트 불러오기
import Compare from './pages/Compare';  // Compare 컴포넌트 불러오기

function App() {
  return (
    <Router>  {/* 애플리케이션 라우팅을 관리하는 컴포넌트 */}
      <div className="App">
        <header className="App-header">
          <h1>재무정보의 모든것</h1>  {/* 페이지의 제목 */}
          <h2>빠르고 간단하게.</h2>  {/* 부제목 */}
          <nav>
            <ul className="list">
              {/* 페이지 간 이동을 위한 링크 설정 */}
              <li><Link to="/">홈</Link></li>
              <li><Link to="/about">소개</Link></li>
              <li><Link to="/compare">재무정보비교</Link></li>
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            {/* URL 경로에 따라 다른 컴포넌트를 렌더링 */}
            <Route path="/" element={<Home />} />  {/* 홈 페이지 */}
            <Route path="/about" element={<About />} />  {/* 소개 페이지 */}
            <Route path="/search" element={<Search />} />  {/* 재무정보 검색 페이지 */}
            <Route path="/compare" element={<Compare />} />  {/* 재무정보 비교교 페이지 */}
          </Routes>
        </main>
        <footer>
          <p>© {new Date().getFullYear()} GOFI</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;