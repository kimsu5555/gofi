import React, { useEffect, useRef } from 'react';
import './About.css';

function About() {
  const aboutSectionRef = useRef(null);

  useEffect(() => {
    aboutSectionRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div>
      <h1>소개 페이지</h1>
      <section ref={aboutSectionRef}>
        <p>이것은 소개 페이지의 메인 섹션입니다.</p>
      </section>
      <p>소개 페이지 설명</p>
    </div>
  );
}

export default About;