/* 탭바 고정 스타일 수정 */
.tabs {
  display: flex;
  background: white;
  border-bottom: 2px solid var(--border);
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  position: sticky;
  top: 60px;  /* 헤더 높이(약 60px) 이후에 고정 */
  z-index: 99;
  background-color: white;
}


/* 헤더 고정 스타일 수정 */
header {
  background: linear-gradient(135deg,#5c3d1e 0%,#7a5230 50%,#9e6b3e 100%);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 24px rgba(80,50,20,0.35);
  flex-wrap: nowrap;
}


/* 페이지 패딩 조정 (탭바 공간 확보) */
.page {
  display: none !important;
  padding: 14px;
  padding-bottom: 100px;
  padding-top: 0;  /* 상단 패딩 제거 */
}


/* 스와이프 컨테이너 높이 조정 */
#swipe-container {
  position: relative;
  min-height: calc(100dvh - 120px);  /* 헤더+탭 높이 제외 */
}