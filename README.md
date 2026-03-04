# ✦ cu-visuals

Визуальный слой для пресета **chuDICKuwu** в SillyTavern.

---

## ⚠️ GitHub не нужен

Устанавливается вручную через Termux. Никаких репозиториев создавать не надо.

---

## Установка

1. Скачай `cu-visuals.zip` из чата
2. Открой Termux:

```bash
unzip /sdcard/Download/cu-visuals.zip -d /sdcard/Download/
mkdir -p ~/SillyTavern/public/scripts/extensions/third-party
cp -r /sdcard/Download/cu-visuals ~/SillyTavern/public/scripts/extensions/third-party/
```

3. Перезагрузи SillyTavern → **Extensions → ✦ cu-visuals**

---

## Пресет chuDICKuwu_v7.json

Импортируй вместо старой версии:
**AI Response Configuration → папка → Import → `chuDICKuwu_v7.json`**

Что изменилось:
- `fawn: ui cleaner` → `✦ ui cleaner`
- `fawn: time tracker` → `✦ time tracker` (остаётся выключен)
- Добавлены два промпта внутри `<visuals>` (по умолчанию выключены):
  - `║ › auto receipt` — модель сама ставит чек при покупках
  - `║ › auto documents` — модель сама ставит теги для писем, телефона, газет, дневника, билетов, справок, меню

---

## Паки и как ими пользоваться

### 🧠 think hider / ✦ scene separator / «» quotes & thoughts
Ничего не нужно делать. Включил — работает.

---

### 🧾 receipt (чек)

**Автоматически:** включи `║ › auto receipt` в пресете (внутри `<visuals>`).
Модель будет сама выводить чек при любой покупке.

**Вручную в карточку:**
```
При покупке выводи блок [RECEIPT]...[/RECEIPT]:
[RECEIPT]
store: название
date: дата
- Товар x1 — цена ₽
total: итого ₽
paid: способ оплаты
[/RECEIPT]
```

---

### 🎫 ticket (билет)

```
[TICKET]
type: поезд
from: Москва
to: Санкт-Петербург
date: 18 марта 2024
time: 23:45
seat: вагон 5, место 18
passenger: Иванова А.С.
[/TICKET]
```

---

### Остальные документы (✉️ 📱 📰 📓 🔴 🏥 🍽️)

**Автоматически:** включи `║ › auto documents` в пресете.

**Вручную** — добавь в карточку нужный тег. Примеры:

```
[LETTER from="Имя"]текст письма[/LETTER]
[PHONE from="Имя контакта"]текст переписки[/PHONE]
[NEWSPAPER headline="Заголовок"]текст статьи[/NEWSPAPER]
[DIARY date="14 марта"]текст записи[/DIARY]
[WANTED name="Имя" reward="100 000 ₽"]описание[/WANTED]
[MEDICAL type="рецепт" patient="Иванова А."]содержание[/MEDICAL]
[MENU place="Кафе Полночь"]
# Горячие блюда
- Борщ — 290 ₽
- Котлета по-киевски — 450 ₽
[/MENU]
```

---

## Продолжение работы в новых чатах

Прикрепи к сообщению `index.js` + `style.css` и напиши:

> «Это расширение cu-visuals для пресета chuDICKuwu в SillyTavern. Хочу [что именно].»

---

## Структура файлов

```
cu-visuals/
├── manifest.json
├── index.js
├── settings.html
├── style.css
├── README.md
└── regexes/
    ├── think-hider.json   ├── ticket.json
    ├── scene-sep.json     ├── newspaper.json
    ├── time-display.json  ├── diary.json
    ├── letter.json        ├── wanted.json
    ├── phone.json         ├── medical.json
    ├── receipt.json       ├── menu.json
    └── quotes.json
```
