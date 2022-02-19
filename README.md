# Дополнительно

1. docker exec -it buhgalter_payment_co zh - подключиться к контейнеру
2. docker-compose logs - просмотр логов
3. docker-compose down && docker-compose up -d --no-deps --build - остановка контейнеров и их пересборка
4. docker-compose down && docker-compose build --no-cache && docker-compose up -d - остановка контейнеров и их пересборка (без кэша)
5. docker system df - просмотр занимаемых ресурсов
6. docker-compose ps - просмотр активных контейнеров
