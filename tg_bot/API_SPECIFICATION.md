# API Specification для Backend интеграции

## Обзор

Telegram бот отправляет обращения граждан на backend API через HTTP POST запросы. Этот документ описывает требуемые endpoints и форматы данных.

## Endpoints

### 1. Отправка обращения

**Endpoint:** `POST /api/reports`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
User-Agent: GovServices-TelegramBot/1.0
```

**Request Body:**
```json
{
  "report_type": "Жалоба",
  "region": "Бишкек",
  "city": "Бишкек",
  "content": "Текст обращения от пользователя",
  "contact_info": "ФИО пользователя",
  "telegram_user_id": 123456789,
  "telegram_username": "username",
  "location": {
    "latitude": 42.8746,
    "longitude": 74.5698,
    "address": "Бишкек, Кыргызстан",
    "source": "city_selection"
  },
  "created_at": "25.01.2025 14:30",
  "source": "telegram_bot",
  "version": "1.0"
}
```

**Response (Success - 200 OK):**
```json
{
  "id": "REP-2025-001234",
  "status": "registered",
  "created_at": "2025-01-25T14:30:00Z",
  "message": "Report registered successfully"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "validation_error",
  "message": "Invalid region specified",
  "details": {
    "field": "region",
    "value": "InvalidRegion"
  }
}
```

### 2. Проверка статуса обращения (опционально)

**Endpoint:** `GET /api/reports/{report_id}`

**Headers:**
```
Authorization: Bearer {API_KEY}
User-Agent: GovServices-TelegramBot/1.0
```

**Response (Success - 200 OK):**
```json
{
  "id": "REP-2025-001234",
  "status": "in_progress",
  "created_at": "2025-01-25T14:30:00Z",
  "updated_at": "2025-01-26T10:15:00Z",
  "assigned_to": "Department of Digital Development",
  "estimated_completion": "2025-02-08T17:00:00Z"
}
```

## Поля данных

### report_type
- **Тип:** string
- **Возможные значения:** "Жалоба", "Рекомендации"
- **Обязательное:** Да

### region
- **Тип:** string
- **Возможные значения:** См. список в `config.py` - `REGIONS_CITIES.keys()`
- **Обязательное:** Да

### city
- **Тип:** string
- **Возможные значения:** См. список в `config.py` - города соответствующего региона
- **Обязательное:** Да

### content
- **Тип:** string
- **Минимальная длина:** 10 символов
- **Обязательное:** Да

### contact_info
- **Тип:** string
- **Минимальная длина:** 2 символа
- **Описание:** ФИО или контактная информация пользователя
- **Обязательное:** Да

### location
- **Тип:** object
- **Поля:**
  - `latitude` (float) - широта
  - `longitude` (float) - долгота
  - `address` (string) - текстовый адрес
  - `source` (string) - источник координат ("city_selection")
- **Обязательное:** Да

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Некорректные данные запроса |
| 401 | Неверный API ключ |
| 403 | Доступ запрещен |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

## Безопасность

1. **Авторизация:** Все запросы должны содержать валидный Bearer token в заголовке Authorization
2. **HTTPS:** Все запросы должны выполняться через HTTPS
3. **Rate Limiting:** Рекомендуется ограничение - не более 100 запросов в минуту с одного источника

## Таймауты

- **Отправка обращения:** 30 секунд
- **Проверка статуса:** 15 секунд

## Логирование

Бот логирует следующие события:
- Успешная отправка обращения в API
- Ошибки API (с кодами и сообщениями)
- Таймауты соединения
- Ошибки сети

## Резервное сохранение

При недоступности API или ошибках отправки:
1. Обращение сохраняется локально в JSON файл
2. Администратор получает уведомление с информацией об ошибке API
3. Пользователь получает подтверждение с локальным номером

## Пример интеграции

```python
# Пример backend endpoint (FastAPI)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ReportRequest(BaseModel):
    report_type: str
    region: str
    city: str
    content: str
    contact_info: str
    telegram_user_id: int
    location: dict

@app.post("/api/reports")
async def create_report(report: ReportRequest):
    # Валидация данных
    if report.report_type not in ["Жалоба", "Рекомендации"]:
        raise HTTPException(400, "Invalid report type")
    
    # Сохранение в БД
    report_id = save_to_database(report)
    
    return {
        "id": report_id,
        "status": "registered",
        "message": "Report registered successfully"
    }
``` 