/* BINARI · 설정값 — 숫자나 주소만 바꾸면 되는 것들을 모아 둔 파일 */
window.BINARI_CONFIG = {

  // 굿판 랭킹 맨 위 "BYEORI ★ 기록" 줄의 점수.
  // ※ 임시 값. 지예가 완성본을 몇 번 해 보고 정해서 알려 주면 이 숫자만 바꾼다.
  byeoriScore: 15000,

  // 랭킹 저장 위치.
  //  provider: 'local'    → 그 폰 안에만 저장 (지금)
  //  provider: 'supabase' → 아래 두 값을 채우면 모두가 같이 보는 공유 랭킹으로 바뀜
  //    supabaseUrl : 프로젝트 주소 (https://xxxx.supabase.co)
  //    supabaseKey : anon public 키
  //    table       : 표 이름. 열: id(text) name(text) score(int) perfect(int) combo(int) root(int) at(bigint)
  ranking: {
    provider: 'local',
    supabaseUrl: '',
    supabaseKey: '',
    table: 'ritual_scores'
  },

  // 반복 재생용 BGM 파일 주소 (예: 'assets/audio/bgm.mp3').
  // 비어 있으면 BGM 버튼이 나오지 않는다. 효과음과 따로 켜고 끈다.
  bgm: '',

  // 부스 모드(?booth=1, 부스 아이패드)
  //  idleSeconds : 아무 조작이 없을 때 "다음 관리자를 기다리는 중"으로 바뀌는 시간(초)
  //  width · minHeight : 안쪽 폰 화면의 기준 크기. 이 비율 그대로 아이패드에 맞춰 키운다
  booth: { idleSeconds: 60, width: 440, minHeight: 780 }
};
