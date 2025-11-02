# WbApiGAS
Реализация методов Wb Api в среде Google Apps Script

### Идентификатор 
```
18Y-1GMrDw5jiPMEgNOVDIg0wFzPmcTeF2qF24wlqJE9k4O2HNtyN6PUo
```
# Подключение библиотеки к скрипту 🚀
[Как подключить библиотеку в Google Apps Script?](https://external.software/archives/49259)
# Автор
[@flidey](https://t.me/flidey)

# Примеры использования
Данные о продавце: наименование кабинета, API-token кабинета
```javascript
const seller = {
    name: "ИП Иванов",
    token: "eRl...ffa"
}
```
Получение карточек товаров
```javascript
const cards = WbApi.getCardsList(seller)
```

Получение заказов
```javascript
const orders = WbApi.getOrders(
    seller, 
    {dateFrom: "2024-01-29"}
)
```

Получение детализации к отчётам реализации
```javascript
const reportDetail = WbApi.getReportDetailByPeriod(
    seller, 
    {
        dateFrom: "2024-01-29",
        dateTo: "2025-01-01"
    }
)
```

Получение количества остатков товаров на складах WB
```javascript
const orders = WbApi.getStocksWB(
    seller, 
    {dateFrom: "2024-01-29"}
)
```

Получение списка всех складов WB для привязки к складам продавца
```javascript
const orders = WbApi.getWarehouses(seller)
```

Получение данных об остатках товаров на складах продавца
```javascript
const orders = WbApi.getStocksFBS(
    seller, 
    {warehouseId: 746293},
    {skus: ["BarcodeTest123"]}
)
```