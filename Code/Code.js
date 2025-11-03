// ═══════════════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ
// ═══════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Базовые URL для разных API
  STATISTICS_API: 'https://statistics-api.wildberries.ru',
  CONTENT_API: 'https://content-api.wildberries.ru',
  MARKETPLACE_API: 'https://marketplace-api.wildberries.ru',
  ANALYTICS_API: 'https://seller-analytics-api.wildberries.ru',
};

// ═══════════════════════════════════════════════════════════════════════
// fetchWithRetry_
// ═══════════════════════════════════════════════════════════════════════

/**
 * @description Выполняет API запрос с обработкой rate limits
 * @param {string} url The URL to fetch. The URL can have up to 2,082 characters.
 * @param {object} options Опции запроса
 * @param {number} maxRetries Количество попыток запроса
 * @return {UrlFetchApp.HTTPResponce} The HTTP response data.
 */
function fetchWithRetry_(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      const headers = response.getAllHeaders();

      switch(statusCode){
        case 429:
          const retryHeader = headers['X-Ratelimit-Retry'] || headers['x-ratelimit-retry'];
          const retrySec = retryHeader ? parseInt(retryHeader, 10) : 20;
          Logger.log(`Rate limit - ожидание ${retrySec + 1} секунд`);
          Utilities.sleep((retrySec + 1) * 1000);
          continue;

        case 401:
          throw new Error('401 Unauthorized: проверьте токен API');
      }
      
      return response;
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      Logger.log(`Попытка ${attempt} не удалась, повтор...`);
      Utilities.sleep(2000);
    };
  };
};

// ═══════════════════════════════════════════════════════════════════════
// getCardsList
// ═══════════════════════════════════════════════════════════════════════

/**
 * @description Метод возвращает список созданных карточек товаров. Более подробное описание: https://dev.wildberries.ru/openapi/work-with-products#tag/Kartochki-tovarov/paths/~1content~1v2~1get~1cards~1list/post
 * @param seller Данные о продавце: наименование кабинета, API-token кабинета.
 * ```javascript
 * seller = {
 *   name: "ИП Иванов",
 *   token: "eyJh...Ezg"
 * }
 * ```
 * @return {any[]}
 */
function getCardsList(seller = {name: "ИП Иванов", token: ""}) {

  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try{
    const allCards = [];
    const url = `${CONFIG.CONTENT_API}/content/v2/get/cards/list`;

    let cursor = { limit: 100 };
    const filter = { withPhoto: -1 };

    while (true) {
      const payload = { settings: { cursor, filter } };
      const options = {
        method: 'post',
        headers: {
          'Authorization': seller.token,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = fetchWithRetry_(url, options);
      if (response.getResponseCode() !== 200) {
        throw new Error('Ошибка API: ' + response.getContentText());
      }
      const data = JSON.parse(response.getContentText());

      allCards.push(...data.cards);

      if (data.cursor.total < cursor.limit) break;

      cursor = {
        limit: cursor.limit,
        updatedAt: data.cursor.updatedAt,
        nmID: data.cursor.nmID
      };
    }

    Logger.log(`Все возможные данные выгружены. Всего записей: ${allCards.length}`)
    return allCards;
    
  } catch(error){
    console.error(error);
  };
};

// ═══════════════════════════════════════════════════════════════════════
// getReportDetailByPeriod
// ═══════════════════════════════════════════════════════════════════════

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
};

// ═══════════════════════════════════════════════════════════════════════
// getOrders
// ═══════════════════════════════════════════════════════════════════════

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
};

// ═══════════════════════════════════════════════════════════════════════
// getStocksWB
// ═══════════════════════════════════════════════════════════════════════

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
  };
};

// ═══════════════════════════════════════════════════════════════════════
// getWarehouses
// ═══════════════════════════════════════════════════════════════════════

/**
 * @description Метод возвращает список всех складов WB для привязки к складам продавца. Предназначен для определения складов WB, чтобы сдавать готовые заказы по модели FBS (Fulfillment by Seller). Более подробное описание: https://dev.wildberries.ru/openapi/work-with-products#tag/Sklady-prodavca/paths/~1api~1v3~1offices/get
 * @param seller Данные о продавце: наименование кабинета, API-token кабинета.
 * ```javascript
 * seller = {
 *   name: "ИП Иванов",
 *   token: "eyJh...Ezg"
 * }
 * ```
 * @return {any[]}
 */
function getWarehouses(seller = {name: "ИП Иванов", token: ""}) {
  
  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try {
    const url = `${CONFIG.MARKETPLACE_API}/api/v3/warehouses`;
    
    const response = fetchWithRetry_(url, {
      method: 'get',
      headers: { 'Authorization': seller.token },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      throw new Error('Ошибка API: ' + response.getContentText());
    }
    
    const warehouses = JSON.parse(response.getContentText());    

    Logger.log(`Все возможные данные выгружены. Всего записей: ${warehouses.length}`);
    return warehouses;

  } catch (error) {
    console.error(error)
  }
};

// ═══════════════════════════════════════════════════════════════════════
// getStocksFBS
// ═══════════════════════════════════════════════════════════════════════

/**
 * @description Метод возвращает данные об остатках товаров на складах продавца. Более подробное описание: https://dev.wildberries.ru/openapi/work-with-products#tag/Ostatki-na-skladah-prodavca/paths/~1api~1v3~1stocks~1%7BwarehouseId%7D/post
 * @param seller Данные о продавце: наименование кабинета, API-token кабинета.
 * ```javascript
 * seller = {
 *   name: "ИП Иванов",
 *   token: "eyJh...Ezg"
 * }
 * ```
 * @param {Object} pathParameters Path Parameters запроса.
 * ```javascript
 * pathParameters = {
 *  warehouseId: 746293
 * }
 * ```
 * @param {Object} payload Payload запроса.
 * ```javascript
 * payload = {
 *   skus: [
 *   "BarcodeTest123"
 *   ]
 * }
 * ```
 * @return {any[]}
 */
function getStocksFBS(seller = {name: "ИП Иванов", token: ""}, pathParameters = {warehouseId: 0}, payload = {skus: []}) {

  Logger.log(`Выполняется запрос для ${seller.name}...`);
  try{
    const url = `${CONFIG.MARKETPLACE_API}/api/v3/stocks/${pathParameters.warehouseId}`;

    const options  = {
    method: 'post',
    headers: { 
      "Content-Type": "application/json",
      'Authorization': seller.token
      },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

    const response = fetchWithRetry_(url, options);
    if (response.getResponseCode() !== 200) {
      throw new Error('Ошибка API: ' + response.getContentText());
    }

    const stocks = JSON.parse(response.getContentText()).stocks;

    Logger.log(`Все возможные данные выгружены. Всего записей: ${stocks.length}`)
    return stocks;
    
  } catch(error){
    console.error(error);
  };
};
