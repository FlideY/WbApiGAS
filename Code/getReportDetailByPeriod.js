/**
 * @description Метод возвращает детализации к отчётам реализации. Данные доступны с 29 января 2024 года. Более подробное описание: https://dev.wildberries.ru/openapi/financial-reports-and-accounting#tag/Finansovye-otchyoty/paths/~1api~1v5~1supplier~1reportDetailByPeriod/get
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
 *   dateFrom: "2024-01-29",
 *   dateTo: "2025-10-01"
 * }
 * ```
 * @return {any[]}
 */
function getReportDetailByPeriod(seller = {name: "ИП Иванов", token: ""}, queryParameters = {dateFrom: "2024-01-29", dateTo: "2025-10-01"}) {
  
  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try {
    const limit = 25000;
    
    let rrdid = 0;
    let allData = [];
    
    while (true) {
      const url = `${CONFIG.STATISTICS_API}/api/v5/supplier/reportDetailByPeriod?dateFrom=${queryParameters.dateFrom}&dateTo=${queryParameters.dateTo}&limit=${limit}&rrdid=${rrdid}`;
      
      const response = fetchWithRetry_(url, {
        method: 'get',
        headers: { 'Authorization': seller.token },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() !== 200) {
        throw new Error('Ошибка API: ' + response.getContentText());
      }
      
      const data = JSON.parse(response.getContentText());
      
      if (!data || data.length === 0) break;
      
      allData.push(...data);
      
      rrdid = data[data.length - 1].rrd_id;
      Logger.log(`Загружено записей: ${allData.length}. Дата последней записи: ${data[data.length - 1].rr_dt}`);
      
      if (data.length < limit) break;
    }

    Logger.log(`Все возможные данные выгружены. Всего записей: ${allData.length}`)
    return allData;  

  } catch (error) {
    console.error(error);
  };
}
