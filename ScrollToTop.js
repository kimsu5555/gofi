// src/components/ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
  }, [pathname]); // pathname이 바뀔 때마다 실행

  return null;
}

export default ScrollToTop;