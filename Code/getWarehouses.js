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
}