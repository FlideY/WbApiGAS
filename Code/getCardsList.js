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
}
