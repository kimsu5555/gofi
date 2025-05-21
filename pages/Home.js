// src/pages/Home.js
import React, { useEffect, useRef } from 'react';

function Home() {
  const homeSectionRef = useRef(null);

  useEffect(() => {
    // Home 컴포넌트가 마운트될 때 homeSectionRef로 스크롤
    homeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div>
      <h1>홈 페이지</h1>
      <section ref={homeSectionRef}>
        <p>이것은 홈 페이지의 메인 섹션입니다.</p>
      </section>
      <p>홈 페이지의 설명</p>
    </div>
  );
}

export default Home;