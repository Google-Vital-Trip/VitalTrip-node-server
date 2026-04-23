새 기능 브랜치를 생성하고 작업을 시작합니다.

인자: $ARGUMENTS (브랜치명, 예: first-aid)

```bash
git checkout main
git pull origin main
git checkout -b feature/$ARGUMENTS
```

브랜치 생성 후 작업 완료 시에는 `/pr` 명령어로 PR을 생성합니다.
