---
trigger: always_on
---

## Проект
Magic Shop Tycoon — игра для Яндекс Игр. Стек: Svelte + TS + Vite + GSAP. Только SVG. Yandex SDK v2. Локализация: RU/EN/TR. Контекст проекта — в KI `magic-shop-tycoon`.

## Поведение агента
- Короткие чёткие ответы с подробно расписанными действиями
- Думай перед ответом, не торопись
- Чистый минималистичный код, без лишних абстракций
- Честность: не поддакивай, стой на своём если я объективно неправ
- Анализируй весь диалог, не только последние сообщения
- Доделывай до конца, не останавливайся на полпути
- Используй русский язык и символы

## Правила разработки
- `browser_subagent` запрещён (зависает). Визуальная проверка — Chrome headless:
  1. Проверить сервер: `Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5`
  2. Скриншот: `& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --screenshot="C:\projects\magic-shop-tycoon\screenshot.png" --window-size=1280,800 --disable-gpu http://localhost:5173; Start-Sleep -Seconds 3`
  3. Просмотр: `view_file` на `screenshot.png`, затем удалить
- Коммиты делает агент сам по необходимости
- Оптимизация для слабых ПК и мобильных — приоритет
- Медленная экономика: удержание игроков важнее скорости прогресса
- Обновляй `docs/project_diary.md` при значимых изменениях
- Claude-Mem воркер: порт 37777. Если не отвечает — `npx claude-mem start`
