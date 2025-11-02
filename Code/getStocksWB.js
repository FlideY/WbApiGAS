/**
 * @description Метод возвращает количество остатков товаров на складах WB. Более подробное описание: https://dev.wildberries.ru/openapi/reports#tag/Osnovnye-otchyoty/paths/~1api~1v1~1supplier~1stocks/get
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
function getStocksWB(seller = {name: "ИП Иванов", token: ""}, queryParameters = {dateFrom: '2020-01-01'}) {

  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try {
    let currentDateFrom = `${queryParameters.dateFrom}T00:00:00`;
    let allStocks = [];

    while (true) {
      const url = `${CONFIG.STATISTICS_API}/api/v1/supplier/stocks?dateFrom=${currentDateFrom}`;
      
      const response = fetchWithRetry_(url, {
        method: 'get',
        headers: { 'Authorization': seller.token },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() !== 200) {
        throw new Error('Ошибка API: ' + response.getContentText());
      }
      
      const stocks = JSON.parse(response.getContentText());
      
      if (!stocks.length) break;
      
      allStocks.push(...stocks);
      currentDateFrom = stocks[stocks.length - 1].lastChangeDate;
      Logger.log(`Загружено записей: ${allStocks.length}. Дата последней записи: ${stocks[stocks.length - 1].lastChangeDate}`)
    }

    Logger.log(`Все возможные данные выгружены. Всего записей: ${allStocks.length}`);
    return allStocks;

  } catch (error) {
    console.error(error)
  }
}
