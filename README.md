# 기획 로그 — 조곤조곤 작업실

유튜브 채널 "조곤조곤 작업실"의 원고 기획 과정을 기록·공개하는 정적 사이트다. 순수 HTML/CSS/JS, 빌드·외부 라이브러리 없음.

새 에피소드를 추가하려면 `episodes/<번호>.json`을 06.json과 같은 구조로 만들고, `episodes/index.json` 배열에 그 번호 문자열을 추가하면 된다. index.html과 episode.html이 JSON을 fetch해 자동으로 렌더한다.

로컬 확인: `python3 -m http.server`로 띄워서 열 것 (file://로는 fetch가 막힌다).
