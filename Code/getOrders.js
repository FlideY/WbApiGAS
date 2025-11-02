/**
 * @description Метод возвращает информацию обо всех заказах. Более подробное описание: https://dev.wildberries.ru/openapi/reports#tag/Osnovnye-otchyoty/paths/~1api~1v1~1supplier~1orders/get
 * @param seller Данные о продавце: наименование кабинета, API-token кабинета.
 * ```javascript
 * seller = {
 *   name: "ИП Иванов",
 *   token: "eyJh...Ezg"
 * }
 * ```
 * @param {Object} queryParameters Query Parameters запроса
 * ```javascript
 * queryParameters = {
 *   dateFrom: "2024-01-29"
 * }
 * ```
 * @return {any[]}
 */
function getOrders(seller = {name: "ИП Иванов", token: ""}, queryParameters = {dateFrom: '2020-01-01'}) {
  
  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try {
    let currentDateFrom = `${queryParameters.dateFrom}T00:00:00`;
    let allOrders = [];

    while (true) {
      const url = `${CONFIG.STATISTICS_API}/api/v1/supplier/orders?dateFrom=${encodeURIComponent(currentDateFrom)}&flag=0`;
      
      const response = fetchWithRetry_(url, {
        method: 'get',
        headers: { 'Authorization': seller.token },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() !== 200) {
        throw new Error('Ошибка API: ' + response.getContentText());
      }
      
      const orders = JSON.parse(response.getContentText());
      
      if (!orders.length) break;
      
      allOrders.push(...orders);
      currentDateFrom = orders[orders.length - 1].lastChangeDate;
      Logger.log(`Загружено записей: ${allOrders.length}. Дата последней записи: ${orders[orders.length - 1].lastChangeDate}`)
    }

    Logger.log(`Все возможные данные выгружены. Всего записей: ${allOrders.length}`);
    return allOrders;

  } catch (error) {
    console.error(error)
  }
}
