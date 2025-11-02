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