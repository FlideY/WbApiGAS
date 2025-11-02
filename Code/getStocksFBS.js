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
}