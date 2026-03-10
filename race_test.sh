#!/bin/bash
# race_test.sh — Проверка защиты от гонки (race condition) при "Взять в работу"
#
# Скрипт создаёт заявку, назначает мастера, затем отправляет
# два параллельных запроса "take" — один должен получить 200 OK,
# другой — 409 Conflict (или 400 Bad Request).
#
# Использование: ./race_test.sh [BASE_URL]
# По умолчанию: http://localhost:3000

set -e

BASE_URL="${1:-http://localhost:3000}"
API="$BASE_URL/api"

echo "=== Тест гонки (race condition) ==="
echo "Base URL: $BASE_URL"
echo ""

# 1. Login as dispatcher
echo "1. Авторизация диспетчера..."
DISP_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"dispatcher","password":"dispatcher123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DISP_TOKEN" ]; then
  echo "ОШИБКА: Не удалось авторизоваться как диспетчер"
  exit 1
fi
echo "   OK"

# 2. Login as master1
echo "2. Авторизация мастера..."
MASTER_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"master1","password":"master123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$MASTER_TOKEN" ]; then
  echo "ОШИБКА: Не удалось авторизоваться как мастер"
  exit 1
fi
echo "   OK"

# 3. Get master1 user info
echo "3. Получение информации о мастере..."
MASTER_INFO=$(curl -s "$API/auth/me" -H "Authorization: Bearer $MASTER_TOKEN")
MASTER_ID=$(echo "$MASTER_INFO" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "   Master ID: $MASTER_ID"

# 4. Create a new request
echo "4. Создание новой заявки..."
CREATE_RESP=$(curl -s -X POST "$API/requests" \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Тест Гонки","phone":"+7(999)000-00-00","address":"ул. Тестовая, д. 1","problemText":"Проверка race condition"}')
REQUEST_ID=$(echo "$CREATE_RESP" | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -z "$REQUEST_ID" ]; then
  echo "ОШИБКА: Не удалось создать заявку"
  echo "$CREATE_RESP"
  exit 1
fi
echo "   Request ID: $REQUEST_ID"

# 5. Assign to master1
echo "5. Назначение мастера..."
ASSIGN_RESP=$(curl -s -X PATCH "$API/requests/$REQUEST_ID/assign" \
  -H "Authorization: Bearer $DISP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"masterId\":$MASTER_ID}")
echo "   OK"

# 6. Send two parallel "take" requests
echo "6. Отправка двух параллельных запросов 'Взять в работу'..."
echo ""

# Run both requests in parallel, capture HTTP status codes
STATUS1=$(curl -s -o /tmp/race_resp1.txt -w "%{http_code}" -X PATCH "$API/requests/$REQUEST_ID/take" \
  -H "Authorization: Bearer $MASTER_TOKEN") &
PID1=$!

STATUS2=$(curl -s -o /tmp/race_resp2.txt -w "%{http_code}" -X PATCH "$API/requests/$REQUEST_ID/take" \
  -H "Authorization: Bearer $MASTER_TOKEN") &
PID2=$!

wait $PID1
wait $PID2

# Read status codes from temp files (parallel subshells)
STATUS1=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/requests/$REQUEST_ID/take" \
  -H "Authorization: Bearer $MASTER_TOKEN" 2>/dev/null || true)

# Actually, let's re-do this properly since the request already changed state.
# We need a fresh request for proper testing. Let's create another one.

echo "   (Создание второй заявки для чистого теста...)"

CREATE_RESP2=$(curl -s -X POST "$API/requests" \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Тест Гонки 2","phone":"+7(999)000-00-01","address":"ул. Тестовая, д. 2","problemText":"Проверка race condition - повтор"}')
REQUEST_ID2=$(echo "$CREATE_RESP2" | grep -o '"id":[0-9]*' | cut -d: -f2)

curl -s -X PATCH "$API/requests/$REQUEST_ID2/assign" \
  -H "Authorization: Bearer $DISP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"masterId\":$MASTER_ID}" > /dev/null

echo "   Request ID: $REQUEST_ID2"
echo "   Отправка параллельных запросов..."
echo ""

# Use temp files to capture responses
curl -s -o /tmp/race_r1.txt -w "\n%{http_code}" -X PATCH "$API/requests/$REQUEST_ID2/take" \
  -H "Authorization: Bearer $MASTER_TOKEN" > /tmp/race_s1.txt &
P1=$!

curl -s -o /tmp/race_r2.txt -w "\n%{http_code}" -X PATCH "$API/requests/$REQUEST_ID2/take" \
  -H "Authorization: Bearer $MASTER_TOKEN" > /tmp/race_s2.txt &
P2=$!

wait $P1
wait $P2

S1=$(tail -1 /tmp/race_s1.txt)
S2=$(tail -1 /tmp/race_s2.txt)

echo "=== Результаты ==="
echo "Запрос 1: HTTP $S1"
cat /tmp/race_r1.txt
echo ""
echo "Запрос 2: HTTP $S2"
cat /tmp/race_r2.txt
echo ""
echo ""

if { [ "$S1" = "200" ] && [ "$S2" = "409" -o "$S2" = "400" ]; } || \
   { [ "$S2" = "200" ] && [ "$S1" = "409" -o "$S1" = "400" ]; }; then
  echo "ТЕСТ ПРОЙДЕН: Один запрос успешен, второй отклонён. Гонка обработана корректно!"
  exit 0
else
  echo "ТЕСТ ПРОВАЛЕН: Ожидалось 200 + 409/400, получено: $S1 + $S2"
  exit 1
fi
