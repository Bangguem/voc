# JLPT 단어장 PWA

JLPT N5 / N3 단어 학습 앱. GitHub Pages 배포 후 iPhone 홈 화면에 설치 가능한 PWA.

## 파일 구조

```
jlpt-app/
├── index.html        # 뼈대 HTML (구조만, 로직 없음)
├── manifest.json     # PWA 메타 설정
├── sw.js             # Service Worker (오프라인 캐시)
├── css/
│   └── style.css     # 전체 스타일
├── js/
│   ├── data-n5.js    # N5 단어 데이터 (VOCAB_N5 배열)
│   ├── data-n3.js    # N3 단어 데이터 (VOCAB_N3 배열)
│   ├── state.js      # 전역 상태 + localStorage
│   └── app.js        # 렌더링 + 이벤트
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## 단어 데이터 형식

```js
{
  id:      1,
  kanji:   '会う',
  reading: 'あう',
  type:    'verb',      // 'noun' | 'verb' | 'adj' | 'adv'
  meaning: '만나다',
  example: '友達に会います。',
  exTrans: '친구를 만납니다.',
}
```

- `id`는 같은 파일 내에서만 unique하면 됨 (N5와 N3가 같은 id를 가져도 무관)
- `kanji` 필드에 히라가나만 있는 단어도 가능

## 상태 관리 (state.js)

`State` 객체 하나로 전체 상태 관리. 변경 후 반드시 `State.save()` 호출.

```js
State.level           // 'n5' | 'n3'
State.vocab           // 현재 레벨 단어 배열 (getter)
State.knownSet        // 현재 레벨 암기 완료 Set (getter)
State.unknownSet      // 현재 레벨 미암기 Set (getter)
State.filter          // 'all'|'known'|'unknown'|'noun'|'verb'|'adj'|'adv'
State.search          // 검색어
State.sort            // 'index'|'alpha'|'known'
State.mode            // 'list' | 'flash'
State.fontSize        // px 단위 (12~32)
State.hideReadingList // 목록 히라가나 숨기기
State.hideMeaningList // 목록 뜻 숨기기
State.hideReadingFc   // 플래시카드 히라가나 숨기기
State.theme           // 'dark' | 'light'

State.filtered()      // 필터·검색·정렬 적용된 단어 배열 반환
State.markKnown(id)
State.markUnknown(id)
State.save()
```

## CSS 테마

CSS 변수 기반. `<html data-theme="light">` 속성으로 전환.

```css
:root { /* 다크 기본 */ }
:root[data-theme="light"] { /* 라이트 오버라이드 */ }
```

주요 변수: `--bg` `--surface` `--surface2` `--border` `--accent` `--text` `--text-dim` `--text-muted` `--red` `--green` `--fs`

## 새 레벨 추가 시 (예: N4)

1. `js/data-n4.js` 생성 — `const VOCAB_N4 = [...]`
2. `index.html` — 스크립트 태그 + 레벨 탭 버튼 추가
3. `state.js` — `known/unknown` 객체에 `n4` 키 추가, `vocab` getter 수정, `save()` 키 추가
4. `sw.js` — `CORE` 배열에 `'./js/data-n4.js'` 추가
