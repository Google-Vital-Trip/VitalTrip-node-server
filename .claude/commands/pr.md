현재 브랜치의 변경사항을 바탕으로 GitHub PR을 생성합니다.

1. 현재 브랜치의 커밋 목록과 변경 파일을 확인합니다.
2. PR 제목은 한국어로 기능을 간결하게 요약합니다.
3. PR 본문에는 다음을 포함합니다:
   - 구현 내용 (bullet point)
   - 주요 파일 목록
   - 테스트 방법 (curl 예시)
4. `gh pr create` 명령어로 PR을 생성합니다.

브랜치를 원격에 push한 뒤 PR을 만듭니다:
```bash
git push -u origin HEAD
gh pr create --title "<PR 제목>" --body "<본문>"
```
